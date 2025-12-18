import ChatbotService from "./ChatbotService.js";
import ChatHistory from "../models/ChatHistory.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/chatbot/message
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId, guestToken } = req.body;
  const userId = req.user?._id || null;

  if (!message || !message.trim()) {
    return res.status(400).json({ 
      success: false,
      message: "Vui lòng nhập tin nhắn" 
    });
  }

  // Tạo sessionId và guestToken nếu chưa có
  const chatSessionId = sessionId || `session_${Date.now()}`;
  const chatGuestToken = !userId ? (guestToken || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`) : null;

  // Lưu tin nhắn user vào database
  await ChatHistory.create({
    user: userId,
    guestToken: chatGuestToken,
    sender: "user",
    message: message.trim()
  });

  // Xử lý tin nhắn
  const response = await ChatbotService.processMessage(
    message.trim(),
    chatSessionId,
    userId
  );

  // Lưu tin nhắn bot vào database
  await ChatHistory.create({
    user: userId,
    guestToken: chatGuestToken,
    sender: "bot",
    message: response.message,
    intent: response.intent,
    products: response.products?.map(p => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      image: p.image
    })) || []
  });

  return res.json({
    success: true,
    sessionId: chatSessionId,
    guestToken: chatGuestToken,
    data: response
  });
});

// POST /api/chatbot/merge - Merge guest chat vào user khi đăng nhập
export const mergeChatHistory = asyncHandler(async (req, res) => {
  const { guestToken } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }

  if (guestToken) {
    await ChatHistory.mergeGuestToUser(guestToken, userId);
  }

  return res.json({ success: true, message: "Đã merge lịch sử chat" });
});

// GET /api/chatbot/history - Lấy lịch sử chat
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { guestToken } = req.query;
  const limit = parseInt(req.query.limit) || 50;

  const history = await ChatHistory.getHistory(userId, guestToken, limit);

  return res.json({
    success: true,
    data: history.reverse() // Đảo ngược để tin cũ ở trên
  });
});

// GET /api/chatbot/suggestions - Gợi ý câu hỏi
export const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = [
    "Có sản phẩm nào đang giảm giá không?",
    "Tìm áo thun dưới 300k",
    "Sản phẩm bán chạy nhất",
    "Giày Nike",
    "Quần jean nam"
  ];

  return res.json({
    success: true,
    data: suggestions
  });
});
