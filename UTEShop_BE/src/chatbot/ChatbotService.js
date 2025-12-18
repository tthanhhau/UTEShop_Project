import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Brand from "../models/brand.js";
import Order from "../models/order.js";
import { SYSTEM_PROMPT } from "./prompts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChatbotService {
  constructor() {
    this.conversationStates = new Map();
    this._lastApiKey = null;
    this._lastModel = null;
    this._genAI = null;
  }

  // Đọc trực tiếp từ file .env để lấy giá trị mới nhất
  readEnvFile() {
    const envPath = path.join(__dirname, "../../.env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = {};
    
    envContent.split("\n").forEach(line => {
      // Bỏ qua comment và dòng trống
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Loại bỏ quotes nếu có
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Loại bỏ comment inline
        const commentIdx = value.indexOf(" #");
        if (commentIdx > -1) {
          value = value.substring(0, commentIdx).trim();
        }
        envVars[key] = value;
      }
    });
    
    return envVars;
  }

  // Lấy GenAI instance, luôn đọc fresh từ file .env
  getGenAI() {
    // Đọc trực tiếp từ file .env mỗi lần gọi
    const envVars = this.readEnvFile();
    const currentKey = envVars.GEMINI_API_KEY;
    const currentModel = envVars.GEMINI_MODEL || "gemini-1.5-flash";
    
    console.log(`🔑 Gemini API Key: ${currentKey?.substring(0, 15)}...${currentKey?.substring(currentKey.length - 5)}`);
    console.log(`🤖 Using model from .env: ${currentModel}`);
    
    // Luôn tạo instance mới với key hiện tại
    this._genAI = new GoogleGenerativeAI(currentKey);
    this._lastModel = currentModel;
    
    return { genAI: this._genAI, model: currentModel };
  }

  getModel() {
    const { genAI, model } = this.getGenAI();
    console.log(`🤖 Using model: ${model}`);
    return genAI.getGenerativeModel({ model });
  }

  getState(sessionId) {
    if (!this.conversationStates.has(sessionId)) {
      this.conversationStates.set(sessionId, {
        lastProducts: [],
        lastKeyword: null,
        lastFilters: {},
        shownProductIds: [],
        selectedProduct: null,
        selectedSize: null,
        cart: [],
        step: "idle"
      });
    }
    return this.conversationStates.get(sessionId);
  }

  async analyzeMessage(message, state) {
    try {
      let contextPrompt = SYSTEM_PROMPT;
      
      if (state.step === "selecting_size" && state.selectedProduct) {
        contextPrompt += `\n\nCONTEXT: Khách đang chọn size cho "${state.selectedProduct.name}". Size có sẵn: ${state.selectedProduct.sizes?.map(s => s.size).join(", ") || "N/A"}.`;
      }
      
      if (state.step === "confirm_more") {
        contextPrompt += `\n\nCONTEXT: Khách vừa thêm sản phẩm vào giỏ.`;
      }

      if (state.lastProducts.length > 0) {
        contextPrompt += `\n\nSẢN PHẨM VỪA TÌM:\n${state.lastProducts.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}`;
      }

      const prompt = `${contextPrompt}\n\nUser: ${message}\n\nTrả về JSON:`;
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);

      return { intent: "general", filters: {}, message: response.replace(/```json|```/g, "").trim() };
    } catch (error) {
      console.error("Gemini API error:", error);
      return {
        intent: "error",
        filters: {},
        message: "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau! ⏳"
      };
    }
  }

  async searchProducts(filters, limit = 5, excludeIds = []) {
    try {
      const query = { isActive: true, isVisible: true };
      if (excludeIds?.length > 0) query._id = { $nin: excludeIds };
      
      // Xử lý brand
      if (filters.brand) {
        const brand = await Brand.findOne({ name: { $regex: filters.brand, $options: "i" } });
        if (brand) query.brand = brand._id;
      }
      
      // Xử lý category từ filters hoặc từ keyword
      const categoryKeywords = {
        "giày": ["giày", "shoe", "sneaker", "dép", "sandal"],
        "áo": ["áo", "shirt", "polo", "hoodie", "jacket"],
        "quần": ["quần", "pant", "jean", "short", "trouser"],
        "phụ kiện": ["mũ", "nón", "túi", "balo", "thắt lưng", "kính"]
      };
      
      let categoryFound = null;
      const keyword = filters.keyword?.toLowerCase().trim();
      
      // Kiểm tra xem keyword có phải là loại sản phẩm không
      if (keyword) {
        for (const [catName, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(k => keyword.includes(k))) {
            // Tìm category trong DB
            const category = await Category.findOne({ 
              name: { $regex: catName, $options: "i" } 
            });
            if (category) {
              categoryFound = category;
              query.category = category._id;
              console.log(`🔍 Found category: ${category.name} for keyword: ${keyword}`);
              break;
            }
          }
        }
      }
      
      // Nếu có category từ filters, ưu tiên dùng
      if (filters.category && !categoryFound) {
        const category = await Category.findOne({ name: { $regex: filters.category, $options: "i" } });
        if (category) query.category = category._id;
      }
      
      // Nếu không tìm được category từ keyword, tìm theo tên sản phẩm
      if (!categoryFound && keyword) {
        query.name = { $regex: keyword, $options: "i" };
      }
      
      if (filters.hasDiscount) query.discountPercentage = { $gt: 0 };

      console.log(`🔍 Search query:`, JSON.stringify(query, null, 2));
      
      let products = await Product.find(query)
        .populate("category", "name")
        .populate("brand", "name")
        .limit(limit)
        .sort({ soldCount: -1 })
        .lean();
      
      // Fallback: tìm trong description nếu không có kết quả
      if (products.length === 0 && keyword && !categoryFound) {
        delete query.name;
        query.description = { $regex: keyword, $options: "i" };
        products = await Product.find(query)
          .populate("category", "name")
          .populate("brand", "name")
          .limit(limit)
          .lean();
      }
      
      console.log(`🔍 Found ${products.length} products`);
      return products;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  formatProduct(p) {
    return {
      _id: p._id, name: p.name, price: p.price,
      discountPercentage: p.discountPercentage || 0,
      image: p.images?.[0] || null,
      category: p.category?.name, brand: p.brand?.name, sizes: p.sizes
    };
  }

  // Tư vấn size dựa trên chiều cao, cân nặng
  getSizeAdvice(filters) {
    const { height, weight, footLength, productType } = filters;
    
    // Bảng size áo (dựa trên chiều cao và cân nặng)
    const getClothingSize = (h, w) => {
      // h: chiều cao (cm), w: cân nặng (kg)
      if (!h || !w) return null;
      
      // Tính BMI để hỗ trợ
      const bmi = w / ((h / 100) ** 2);
      
      if (h < 160) {
        if (w < 50) return { size: "XS", note: "Dáng nhỏ nhắn" };
        if (w < 58) return { size: "S", note: "Dáng cân đối" };
        if (w < 65) return { size: "M", note: "Dáng vừa" };
        return { size: "L", note: "Dáng đầy đặn" };
      } else if (h < 168) {
        if (w < 55) return { size: "S", note: "Dáng thon" };
        if (w < 63) return { size: "M", note: "Dáng cân đối" };
        if (w < 72) return { size: "L", note: "Dáng vừa" };
        return { size: "XL", note: "Dáng đầy đặn" };
      } else if (h < 175) {
        if (w < 58) return { size: "S", note: "Dáng thon" };
        if (w < 68) return { size: "M", note: "Dáng cân đối" };
        if (w < 78) return { size: "L", note: "Dáng vừa" };
        return { size: "XL", note: "Dáng đầy đặn" };
      } else if (h < 182) {
        if (w < 63) return { size: "M", note: "Dáng thon" };
        if (w < 75) return { size: "L", note: "Dáng cân đối" };
        if (w < 85) return { size: "XL", note: "Dáng vừa" };
        return { size: "XXL", note: "Dáng đầy đặn" };
      } else {
        if (w < 70) return { size: "L", note: "Dáng thon cao" };
        if (w < 82) return { size: "XL", note: "Dáng cân đối" };
        return { size: "XXL", note: "Dáng to cao" };
      }
    };

    // Bảng size quần (dựa trên chiều cao và cân nặng)
    const getPantsSize = (h, w) => {
      if (!h || !w) return null;
      
      if (h < 165) {
        if (w < 52) return { size: "28", waist: "71cm", note: "Eo nhỏ" };
        if (w < 58) return { size: "29", waist: "74cm", note: "Eo vừa" };
        if (w < 65) return { size: "30", waist: "76cm", note: "Eo vừa" };
        if (w < 72) return { size: "31", waist: "79cm", note: "Eo hơi rộng" };
        return { size: "32", waist: "81cm", note: "Eo rộng" };
      } else if (h < 172) {
        if (w < 55) return { size: "29", waist: "74cm", note: "Eo nhỏ" };
        if (w < 63) return { size: "30", waist: "76cm", note: "Eo vừa" };
        if (w < 70) return { size: "31", waist: "79cm", note: "Eo vừa" };
        if (w < 78) return { size: "32", waist: "81cm", note: "Eo hơi rộng" };
        return { size: "33", waist: "84cm", note: "Eo rộng" };
      } else if (h < 180) {
        if (w < 60) return { size: "30", waist: "76cm", note: "Eo nhỏ" };
        if (w < 70) return { size: "31", waist: "79cm", note: "Eo vừa" };
        if (w < 78) return { size: "32", waist: "81cm", note: "Eo vừa" };
        if (w < 85) return { size: "33", waist: "84cm", note: "Eo hơi rộng" };
        return { size: "34", waist: "86cm", note: "Eo rộng" };
      } else {
        if (w < 68) return { size: "31", waist: "79cm", note: "Eo nhỏ" };
        if (w < 78) return { size: "32", waist: "81cm", note: "Eo vừa" };
        if (w < 88) return { size: "33", waist: "84cm", note: "Eo vừa" };
        if (w < 95) return { size: "34", waist: "86cm", note: "Eo hơi rộng" };
        return { size: "36", waist: "91cm", note: "Eo rộng" };
      }
    };

    // Bảng size giày (dựa trên chiều dài chân)
    const getShoeSize = (footLen) => {
      if (!footLen) return null;
      
      const sizeChart = [
        { length: 23, eu: 37, us: 5 },
        { length: 23.5, eu: 37.5, us: 5.5 },
        { length: 24, eu: 38, us: 6 },
        { length: 24.5, eu: 39, us: 6.5 },
        { length: 25, eu: 40, us: 7 },
        { length: 25.5, eu: 40.5, us: 7.5 },
        { length: 26, eu: 41, us: 8 },
        { length: 26.5, eu: 42, us: 8.5 },
        { length: 27, eu: 43, us: 9 },
        { length: 27.5, eu: 43.5, us: 9.5 },
        { length: 28, eu: 44, us: 10 },
        { length: 28.5, eu: 45, us: 10.5 },
        { length: 29, eu: 46, us: 11 },
      ];
      
      const match = sizeChart.find(s => footLen <= s.length) || sizeChart[sizeChart.length - 1];
      return { size: match.eu, us: match.us, note: `Chiều dài chân ${footLen}cm` };
    };

    // Xử lý theo loại sản phẩm
    const type = productType?.toLowerCase() || "";
    
    if (type.includes("giày") || type.includes("shoe") || type.includes("sneaker") || footLength) {
      if (footLength) {
        const advice = getShoeSize(footLength);
        if (advice) {
          return `👟 **TƯ VẤN SIZE GIÀY**\n\n📏 Chiều dài chân: ${footLength}cm\n\n✅ **Size phù hợp: EU ${advice.size} (US ${advice.us})**\n\n💡 **Mẹo chọn giày:**\n• Nên đo chân vào buổi chiều (chân hơi phù)\n• Chừa 0.5-1cm cho thoải mái\n• Giày thể thao nên lấy lớn hơn 0.5 size\n\nBạn muốn tìm giày size ${advice.size} không? 😊`;
        }
      }
      return `👟 **TƯ VẤN SIZE GIÀY**\n\nĐể tư vấn chính xác, bạn cho tôi biết **chiều dài bàn chân** (cm) nhé!\n\n📏 **Cách đo:**\n1. Đặt chân lên giấy trắng\n2. Vẽ viền quanh bàn chân\n3. Đo từ gót đến ngón dài nhất\n\n**Bảng size tham khảo:**\n• 25cm → Size 40\n• 26cm → Size 41\n• 27cm → Size 43\n• 28cm → Size 44`;
    }
    
    if (type.includes("quần") || type.includes("pant") || type.includes("jean")) {
      const advice = getPantsSize(height, weight);
      if (advice) {
        return `👖 **TƯ VẤN SIZE QUẦN**\n\n📏 Chiều cao: ${height}cm | Cân nặng: ${weight}kg\n\n✅ **Size phù hợp: ${advice.size}** (Vòng eo ~${advice.waist})\n📝 ${advice.note}\n\n💡 **Mẹo chọn quần:**\n• Quần jean: lấy vừa hoặc nhỉnh 1 size\n• Quần short: có thể lấy rộng hơn 1 size\n• Quần jogger: lấy đúng size\n\nBạn muốn tìm quần size ${advice.size} không? 😊`;
      }
    }
    
    // Mặc định là áo
    const advice = getClothingSize(height, weight);
    if (advice) {
      return `👕 **TƯ VẤN SIZE ÁO**\n\n📏 Chiều cao: ${height}cm | Cân nặng: ${weight}kg\n\n✅ **Size phù hợp: ${advice.size}**\n📝 ${advice.note}\n\n💡 **Mẹo chọn áo:**\n• Áo thun: lấy đúng size hoặc oversize +1\n• Áo polo: lấy đúng size\n• Hoodie: có thể lấy lớn hơn 1 size\n\nBạn muốn tìm áo size ${advice.size} không? 😊`;
    }
    
    return `📏 **TƯ VẤN SIZE**\n\nĐể tư vấn chính xác, bạn cho tôi biết:\n• **Chiều cao** (cm)\n• **Cân nặng** (kg)\n• **Loại sản phẩm** (áo/quần/giày)\n\nVí dụ: "Tôi cao 170cm nặng 65kg muốn mua áo"`;
  }

  // Tìm đơn hàng theo ngày
  async searchOrdersByDate(userId, filters) {
    try {
      let startDate, endDate;
      const now = new Date();
      
      // Xử lý relative date
      if (filters.relative) {
        switch (filters.relative) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case "yesterday":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "this_week":
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }
      } else if (filters.day) {
        // Xử lý ngày cụ thể
        const day = parseInt(filters.day);
        const month = filters.month ? parseInt(filters.month) - 1 : now.getMonth();
        const year = filters.year ? parseInt(filters.year) : now.getFullYear();
        
        startDate = new Date(year, month, day);
        endDate = new Date(year, month, day + 1);
      } else {
        // Mặc định là hôm nay
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      }

      console.log(`🔍 Searching orders from ${startDate} to ${endDate} for user ${userId}`);

      const orders = await Order.find({
        user: userId,
        createdAt: { $gte: startDate, $lt: endDate }
      })
        .populate("items.product", "name images price")
        .sort({ createdAt: -1 })
        .lean();

      if (orders.length === 0) {
        const dateStr = this.formatDateRange(startDate, endDate, filters);
        return {
          message: `📭 Không tìm thấy đơn hàng nào ${dateStr}.\n\nBạn có thể xem tất cả đơn hàng tại trang "Lịch sử đơn hàng" nhé! 📦`,
          action: null
        };
      }

      // Format thông tin đơn hàng
      const dateStr = this.formatDateRange(startDate, endDate, filters);
      let message = `📦 **ĐƠN HÀNG ${dateStr.toUpperCase()}**\n\nTìm thấy ${orders.length} đơn hàng:\n\n`;

      const formattedOrders = orders.map((order, index) => {
        const statusMap = {
          pending: "⏳ Chờ xác nhận",
          processing: "🔄 Đang xử lý",
          prepared: "📦 Đã chuẩn bị",
          shipped: "🚚 Đang giao",
          delivered: "✅ Đã giao",
          cancelled: "❌ Đã hủy"
        };
        
        const orderDate = new Date(order.createdAt);
        const dateFormatted = orderDate.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        message += `**${index + 1}. Đơn #${order._id.toString().slice(-6).toUpperCase()}**\n`;
        message += `📅 ${dateFormatted}\n`;
        message += `${statusMap[order.status] || order.status}\n`;
        message += `💰 ${order.totalPrice.toLocaleString("vi-VN")}đ\n`;
        message += `📍 ${order.items.length} sản phẩm\n\n`;

        return {
          _id: order._id,
          orderCode: order._id.toString().slice(-6).toUpperCase(),
          status: order.status,
          statusText: statusMap[order.status],
          totalPrice: order.totalPrice,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            name: item.product?.name || "Sản phẩm",
            image: item.product?.images?.[0] || null,
            quantity: item.quantity,
            size: item.size,
            price: item.price
          }))
        };
      });

      message += `\n💡 Nhấn vào đơn hàng để xem chi tiết!`;

      return {
        message,
        action: {
          type: "SHOW_ORDERS",
          orders: formattedOrders
        }
      };
    } catch (error) {
      console.error("Search orders error:", error);
      return {
        message: "😅 Có lỗi khi tìm đơn hàng. Vui lòng thử lại sau!",
        action: null
      };
    }
  }

  formatDateRange(startDate, endDate, filters) {
    if (filters.relative) {
      switch (filters.relative) {
        case "today": return "hôm nay";
        case "yesterday": return "hôm qua";
        case "this_week": return "tuần này";
        case "this_month": return "tháng này";
        default: return "hôm nay";
      }
    }
    
    if (filters.day) {
      const day = filters.day;
      const month = filters.month || (startDate.getMonth() + 1);
      return `ngày ${day}/${month}`;
    }
    
    return "hôm nay";
  }

  detectSimpleIntent(message, state) {
    const msg = message.toLowerCase().trim();
    
    const selectMatch = msg.match(/(?:mua|lấy|chọn)?\s*(?:số|sản phẩm)?\s*(\d+)/i);
    if (selectMatch && state.lastProducts.length > 0) {
      const idx = parseInt(selectMatch[1]);
      if (idx >= 1 && idx <= state.lastProducts.length) {
        return { intent: "select_product", filters: { productIndex: idx }, message: "" };
      }
    }
    
    if (state.step === "selecting_size") {
      // Kiểm tra xem người dùng có đang HỎI về size không (cần tư vấn)
      const needAdvicePatterns = /không biết|ko biết|chọn size nào|size nào phù hợp|nên chọn|tư vấn|phù hợp với tôi|size gì|mặc size nào/i;
      if (needAdvicePatterns.test(msg)) {
        return { intent: "size_advice", filters: { needAdvice: true }, message: "" };
      }
      
      // Chỉ chọn size khi người dùng nói RÕ RÀNG size cụ thể
      const sizeMatch = msg.match(/^(?:lấy |chọn |mua )?(?:size )?(xs|s|m|l|xl|xxl|\d{2})$/i);
      if (sizeMatch) return { intent: "select_size", filters: { size: sizeMatch[1].toUpperCase() }, message: "" };
    }
    
    if (state.cart.length > 0 && /^(không|ko|xong|thanh toán|checkout)$/i.test(msg)) {
      return { intent: "checkout", filters: {}, message: "" };
    }
    
    if (state.step === "confirm_order" && /^(đồng ý|ok|có|xác nhận)$/i.test(msg)) {
      return { intent: "confirm_yes", filters: {}, message: "" };
    }
    
    return null;
  }

  async processMessage(message, sessionId, userId = null) {
    const state = this.getState(sessionId);
    // Lưu userId vào state để dùng cho các tính năng cần xác thực
    if (userId) state.userId = userId;
    console.log(`🤖 [${sessionId}] Message: "${message}" (userId: ${userId || "guest"})`);
    console.log(`🛒 Current cart: ${state.cart.length} items, step: ${state.step}`);
    
    let analysis = this.detectSimpleIntent(message, state);
    if (analysis) {
      console.log(`🤖 Simple detect: ${analysis.intent}`);
    } else {
      analysis = await this.analyzeMessage(message, state);
      console.log(`🤖 AI detect: ${analysis.intent}`);
    }

    let products = [];
    let responseMessage = ""; // Không dùng analysis.message mặc định
    let action = null;

    switch (analysis.intent) {
      case "search_product":
      case "style_advice":
        state.shownProductIds = [];
        products = await this.searchProducts(analysis.filters);
        if (products.length > 0) {
          state.lastProducts = products;
          state.lastKeyword = analysis.filters.keyword;
          state.lastFilters = analysis.filters;
          state.shownProductIds = products.map(p => p._id);
          const keyword = analysis.filters.keyword;
          responseMessage = `🛍️ Tuyệt vời! Tôi tìm thấy ${products.length} sản phẩm${keyword ? ` phù hợp với "${keyword}"` : ""} cho bạn.\n\nBạn có thể nhấn "Mua ngay" hoặc nói "mua số 1" để chọn sản phẩm nhé! 😊`;
        } else {
          const keyword = analysis.filters.keyword || "sản phẩm";
          responseMessage = `😅 Rất tiếc, tôi chưa tìm thấy "${keyword}" trong kho hàng.\n\nBạn thử tìm với từ khóa khác như: áo thun, quần jean, giày sneaker... nhé!`;
        }
        break;

      case "select_product":
        const idx = parseInt(analysis.filters.productIndex) - 1;
        if (state.lastProducts[idx]) {
          state.selectedProduct = state.lastProducts[idx];
          const sizes = state.selectedProduct.sizes?.filter(s => s.stock > 0).map(s => s.size) || [];
          if (sizes.length > 0) {
            state.step = "selecting_size";
            responseMessage = `👍 Lựa chọn tuyệt vời! Bạn đã chọn **${state.selectedProduct.name}**\n\n📏 Vui lòng chọn size phù hợp: ${sizes.join(", ")}\n\n(Gõ size bạn muốn, ví dụ: "M" hoặc "42")`;
          } else {
            state.cart.push({ product: state.selectedProduct, size: "Free Size", quantity: 1 });
            state.step = "confirm_more";
            responseMessage = `✅ Tuyệt vời! Đã thêm **${state.selectedProduct.name}** vào giỏ hàng của bạn!\n\nBạn muốn mua thêm sản phẩm khác không? Hoặc nói "thanh toán" để hoàn tất đơn hàng 🛒`;
          }
          products = [state.selectedProduct];
        } else {
          responseMessage = state.lastProducts.length === 0 
            ? "😊 Bạn chưa tìm sản phẩm nào. Hãy cho tôi biết bạn muốn tìm gì nhé!" 
            : `😊 Vui lòng chọn số từ 1 đến ${state.lastProducts.length} để chọn sản phẩm bạn thích nhé!`;
        }
        break;

      case "select_size":
        if (state.step === "selecting_size" && state.selectedProduct) {
          const size = analysis.filters.size?.toUpperCase();
          const sizeInfo = state.selectedProduct.sizes?.find(s => s.size.toUpperCase() === size);
          if (sizeInfo?.stock > 0) {
            state.cart.push({ product: state.selectedProduct, size, quantity: 1 });
            console.log(`🛒 Added to cart: ${state.selectedProduct.name} size ${size}. Cart now has ${state.cart.length} items`);
            state.step = "confirm_more";
            responseMessage = `✅ Hoàn hảo! Đã thêm **${state.selectedProduct.name}** size **${size}** vào giỏ hàng!\n\n🛒 Giỏ hàng: ${state.cart.length} sản phẩm\n\nBạn muốn xem thêm sản phẩm khác không? Hoặc nói "thanh toán" để đặt hàng ngay!`;
            products = [state.selectedProduct];
          } else {
            const availableSizes = state.selectedProduct.sizes?.filter(s => s.stock > 0).map(s => s.size) || [];
            responseMessage = `😅 Rất tiếc, size ${size} hiện đã hết hàng.\n\nCác size còn hàng: ${availableSizes.join(", ")}\n\nBạn chọn size khác nhé!`;
          }
        }
        break;

      case "checkout":
        if (state.cart.length > 0) {
          let total = 0;
          let summary = "📋 **ĐƠN HÀNG CỦA BẠN:**\n\n";
          state.cart.forEach((item, i) => {
            const price = item.product.price * (1 - (item.product.discountPercentage || 0) / 100);
            total += price;
            summary += `${i + 1}. ${item.product.name} - Size ${item.size} - ${price.toLocaleString()}đ\n`;
          });
          summary += `\n💰 **Tổng cộng: ${total.toLocaleString()}đ**\n\n✨ Nói "đồng ý" hoặc "ok" để xác nhận và chuyển đến trang thanh toán nhé!`;
          state.step = "confirm_order";
          responseMessage = summary;
          products = state.cart.map(i => i.product);
        } else {
          responseMessage = "😊 Giỏ hàng của bạn đang trống.\n\nHãy cho tôi biết bạn muốn tìm sản phẩm gì nhé!";
        }
        break;

      case "confirm_yes":
        if (state.step === "confirm_order" && state.cart.length > 0) {
          console.log(`🛒 Checkout with ${state.cart.length} items:`, state.cart.map(i => i.product.name));
          action = {
            type: "CHECKOUT",
            cartItems: state.cart.map(item => ({
              productId: item.product._id, name: item.product.name,
              price: item.product.price, discountPercentage: item.product.discountPercentage || 0,
              size: item.size, quantity: item.quantity, image: item.product.images?.[0]
            }))
          };
          responseMessage = "🎉 Tuyệt vời! Đang chuyển bạn đến trang thanh toán...\n\nCảm ơn bạn đã mua sắm tại UTEShop! 💙";
          state.cart = []; state.step = "idle"; state.lastProducts = [];
        }
        break;

      case "greeting":
        responseMessage = "Xin chào bạn! 👋\n\nTôi là trợ lý AI của UTEShop, rất vui được hỗ trợ bạn hôm nay!\n\nBạn đang tìm kiếm sản phẩm gì? Tôi có thể giúp bạn tìm áo, quần, giày dép... 😊";
        break;

      case "thanks":
        responseMessage = "Không có gì đâu ạ! 😊\n\nRất vui được hỗ trợ bạn. Nếu cần gì thêm, cứ hỏi tôi nhé! 💙";
        break;

      case "cancel":
        state.cart = []; state.step = "idle";
        responseMessage = "Đã hủy đơn hàng cho bạn! 👍\n\nBạn muốn tìm sản phẩm khác không? Tôi sẵn sàng hỗ trợ bạn! 😊";
        break;

      case "size_advice":
        // Nếu đang chọn size cho sản phẩm cụ thể, tư vấn dựa trên sản phẩm đó
        if (state.step === "selecting_size" && state.selectedProduct) {
          const productName = state.selectedProduct.name.toLowerCase();
          const availableSizes = state.selectedProduct.sizes?.filter(s => s.stock > 0).map(s => s.size) || [];
          
          // Xác định loại sản phẩm từ tên
          let productType = "áo";
          if (productName.includes("quần") || productName.includes("jean") || productName.includes("short")) {
            productType = "quần";
          } else if (productName.includes("giày") || productName.includes("sneaker") || productName.includes("dép")) {
            productType = "giày";
          }
          
          // Nếu có thông tin chiều cao, cân nặng thì tư vấn luôn
          if (analysis.filters.height && analysis.filters.weight) {
            responseMessage = this.getSizeAdvice({ ...analysis.filters, productType });
            responseMessage += `\n\n📦 **${state.selectedProduct.name}** có các size: ${availableSizes.join(", ")}`;
          } else {
            // Hỏi thông tin để tư vấn
            responseMessage = `📏 **TƯ VẤN SIZE CHO ${state.selectedProduct.name.toUpperCase()}**\n\n`;
            responseMessage += `Để tư vấn size phù hợp nhất, bạn cho tôi biết:\n`;
            if (productType === "giày") {
              responseMessage += `• **Chiều dài bàn chân** (cm)\n\nVí dụ: "chân dài 26cm"`;
            } else {
              responseMessage += `• **Chiều cao** (cm)\n• **Cân nặng** (kg)\n\nVí dụ: "cao 170 nặng 65kg"`;
            }
            responseMessage += `\n\n📦 Size có sẵn: ${availableSizes.join(", ")}`;
          }
        } else {
          responseMessage = this.getSizeAdvice(analysis.filters);
        }
        break;

      case "view_order_history":
        action = {
          type: "NAVIGATE",
          url: "/purchase-history"
        };
        responseMessage = "📦 **LỊCH SỬ ĐƠN HÀNG**\n\nĐang chuyển bạn đến trang lịch sử đơn hàng...\n\nTại đây bạn có thể xem tất cả các đơn hàng đã mua! 🛍️";
        break;

      case "track_order":
        action = {
          type: "NAVIGATE",
          url: "/orders-tracking"
        };
        responseMessage = "🚚 **THEO DÕI ĐƠN HÀNG**\n\nĐang chuyển bạn đến trang theo dõi đơn hàng...\n\nTại đây bạn có thể kiểm tra trạng thái giao hàng của các đơn! 📍";
        break;

      case "search_order_by_date":
        // Cần userId để tìm đơn hàng - sẽ được truyền từ controller
        if (!state.userId) {
          responseMessage = "⚠️ Bạn cần đăng nhập để xem đơn hàng.\n\nVui lòng đăng nhập và thử lại nhé! 🔐";
        } else {
          const orderResult = await this.searchOrdersByDate(state.userId, analysis.filters);
          responseMessage = orderResult.message;
          action = orderResult.action;
        }
        break;

      default:
        // Dùng message từ AI cho các intent khác, hoặc message mặc định
        responseMessage = analysis.message || "😊 Tôi có thể giúp bạn tìm kiếm và đặt hàng sản phẩm.\n\nBạn muốn tìm gì hôm nay? Ví dụ: áo thun, quần jean, giày sneaker...";
        break;
    }

    return {
      intent: analysis.intent,
      message: responseMessage,
      products: products.map(p => this.formatProduct(p)),
      action, cartCount: state.cart.length
    };
  }
}

export default new ChatbotService();
