import Order from "../models/order.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import momoService from "../services/momoServices.js";
import Notification from "../models/Notification.js";
import User from "../models/user.js"; // Import User model
import mongoose from "mongoose";
import PointTransaction from "../models/PointTransaction.js";
import Configuration from "../models/Configuration.js";
class OrderController {
  // Create a new order
  createOrder = asyncHandler(async (req, res) => {
    const POINT_TO_VND = 100;
    console.log("🛒 ORDER CREATE - req.user:", req.user);
    console.log("🛒 ORDER CREATE - req.body:", req.body);
    const { agenda, io, sendNotificationToUser } = req.app.locals;

    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      codDetails,
      totalPrice: providedTotalPrice,
      voucher,
      voucherDiscount,
      usedPointsAmount,
      momoOrderId,
      momoRequestId,
      customerName,
      phoneNumber,
      customerPhone,
    } = req.body;

    // Debug log
    console.log("🔍 ORDER CREATE - customerName from body:", customerName);
    console.log("🔍 ORDER CREATE - phoneNumber from body:", phoneNumber);

    console.log("🔍 ORDER CREATE - items:", voucher);

    // Kiểm tra user authentication
    if (!req.user || !req.user._id) {
      console.log("❌ ORDER - No authenticated user");
      return res.status(401).json({
        message: "User authentication failed. Please login again.",
        code: "NO_AUTH_USER",
      });
    }

    const userId = req.user._id;
    console.log("✅ ORDER - User ID:", userId);

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required",
        code: "NO_ITEMS",
      });
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return res.status(400).json({
        message: "Shipping address is required",
        code: "NO_ADDRESS",
      });
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
        code: "NO_CUSTOMER_NAME",
      });
    }

    const finalCustomerPhone = phoneNumber || customerPhone;
    if (!finalCustomerPhone || !finalCustomerPhone.trim()) {
      return res.status(400).json({
        message: "Customer phone is required",
        code: "NO_CUSTOMER_PHONE",
      });
    }

    // ==========================================
    // 🔥 FIX RACE CONDITION: MongoDB Transaction
    // ==========================================
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let subtotal = 0;
      const orderItems = [];

      // 🔒 THAY ĐỔI: Dùng for...of thay vì Promise.all để xử lý tuần tự
      for (const item of items) {
        // 🔒 ATOMIC UPDATE: findOneAndUpdate với điều kiện stock
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity }, // Chỉ update nếu đủ hàng
          },
          {
            $inc: {
              stock: -item.quantity,
              soldCount: item.quantity,
            },
          },
          {
            new: true,
            session, // 🔑 QUAN TRỌNG: Phải có session
            runValidators: true,
          }
        );

        // Nếu product = null => hết hàng hoặc không tìm thấy
        if (!product) {
          // Lấy thông tin product để hiển thị tên
          const productInfo = await Product.findById(item.product).session(
            session
          );
          const productName = productInfo ? productInfo.name : item.product;
          throw new Error(`Insufficient stock for product ${productName}`);
        }

        console.log(
          `✅ Updated product ${product.name}: stock=${product.stock}`
        );

        // Calculate discounted price
        const discountAmount =
          (product.price * product.discountPercentage) / 100;
        const discountedPrice = product.price - discountAmount;

        // Calculate item price with discount and update subtotal
        const itemPrice = discountedPrice * item.quantity;
        subtotal += itemPrice;

        orderItems.push({
          product: item.product,
          quantity: item.quantity,
          originalPrice: product.price,
          discountPercentage: product.discountPercentage,
          discountedPrice: discountedPrice,
          price: discountedPrice,
        });
      }

      console.log("💰 Subtotal from items:", subtotal);
      console.log("🎟️ Voucher discount:", voucherDiscount);
      console.log("⭐ Points deduction:", usedPointsAmount);

      // Tính toán tổng tiền cuối cùng
      const finalTotal =
        subtotal - (voucherDiscount || 0) - (usedPointsAmount || 0);
      console.log("💵 Final total:", finalTotal);

      // ✅ TRỪ ĐIỂM CỦA USER (cũng dùng atomic update)
      if (usedPointsAmount > 0) {
        const pointsUsed = usedPointsAmount;

        const user = await User.findOneAndUpdate(
          {
            _id: req.user._id,
            "loyaltyPoints.balance": { $gte: pointsUsed },
          },
          {
            $inc: { "loyaltyPoints.balance": -pointsUsed },
          },
          {
            new: true,
            session, // 🔑 QUAN TRỌNG: Phải có session
          }
        );

        if (!user) {
          throw new Error("Insufficient loyalty points");
        }

        console.log(`⭐ Trừ ${pointsUsed} điểm từ user ${userId}`);
      }

      // Xử lý thanh toán online nếu cần
      let onlinePaymentInfo = {};
      let initialPaymentStatus = "unpaid";

      if (paymentMethod === "MOMO" && momoOrderId) {
        const requestIdForQuery = momoRequestId || momoOrderId;
        const paymentResult = await momoService.queryTransaction(
          momoOrderId,
          requestIdForQuery
        );

        if (
          !paymentResult.success ||
          String(paymentResult.data.resultCode) !== "0" ||
          paymentResult.data.amount !== finalTotal
        ) {
          throw new Error(
            paymentResult.data?.message ||
            "Payment amount mismatch or payment not completed"
          );
        }

        onlinePaymentInfo = {
          transactionId: paymentResult.data.transId,
          gateway: "MOMO",
          paidAt: new Date(),
          amount: paymentResult.data.amount,
        };

        initialPaymentStatus = "paid";
      }

      // Create order
      const order = new Order({
        user: userId,
        customerName: customerName.trim(),
        customerPhone: finalCustomerPhone.trim(),
        items: orderItems,
        totalPrice: finalTotal,
        voucher: voucher || null,
        voucherDiscount: voucherDiscount || 0,
        usedPointsAmount: usedPointsAmount || 0,
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        paymentStatus: initialPaymentStatus,
        codDetails: {
          phoneNumberConfirmed: false,
          additionalNotes: codDetails?.additionalNotes || "",
        },
        ...(Object.keys(onlinePaymentInfo).length > 0 && { onlinePaymentInfo }),
      });

      // Save order với session
      await order.save({ session });

      // Xử lý voucher đã sử dụng
      if (voucher && voucher.code) {
        console.log("🎟️ Processing used voucher:", {
          userId,
          voucherCode: voucher.code
        });

        // 1. Cập nhật UserVoucher để đánh dấu là đã sử dụng
        const userVoucher = await UserVoucher.findOneAndUpdate(
          {
            user: userId,
            voucherCode: voucher.code,
            isUsed: false
          },
          {
            isUsed: true,
            usedAt: new Date(),
            orderId: order._id
          },
          {
            session,
            new: true
          }
        );

        if (!userVoucher) {
          console.warn("⚠️ UserVoucher not found or already used for:", voucher.code);
        } else {
          console.log("✅ UserVoucher marked as used:", userVoucher._id);
        }

        // 2. Tăng usesCount trong voucher
        const voucherDoc = await Voucher.findById(voucher._id).session(session);
        voucherDoc.usesCount = (voucherDoc.usesCount || 0) + 1;
        await voucherDoc.save({ session });
        console.log("✅ Voucher usesCount incremented");

        // 3. Tăng usedVouchersCount trong user
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $inc: { "voucherStats.usedVouchersCount": 1 }
          },
          {
            session,
            new: true
          }
        );

        if (!updatedUser) {
          throw new Error("Failed to update user voucher statistics");
        }
        console.log("✅ User usedVouchersCount incremented");

        // 4. Xóa voucher khỏi user's voucherClaims (giữ logic cũ)
        const user = await User.findById(userId).session(session);
        const userVoucherClaim = user.voucherClaims.find(v => v.voucherCode === voucher.code);

        if (userVoucherClaim) {
          if (userVoucherClaim.claimCount > 1) {
            // Giảm claimCount đi 1 nếu còn nhiều hơn 1 lần sử dụng
            console.log("📊 Decreasing voucher claim count:", {
              current: userVoucherClaim.claimCount,
              new: userVoucherClaim.claimCount - 1
            });

            await User.findByIdAndUpdate(
              userId,
              {
                $set: {
                  "voucherClaims.$[elem].claimCount": userVoucherClaim.claimCount - 1,
                  "voucherClaims.$[elem].lastClaimed": new Date()
                }
              },
              {
                arrayFilters: [{ "elem.voucherCode": voucher.code }],
                session,
                new: true
              }
            );
            console.log("✅ Voucher claim count updated successfully");
          } else {
            // Xóa voucher nếu đây là lần sử dụng cuối cùng
            console.log("🗑️ Removing voucher (last claim used):", voucher.code);

            await User.findByIdAndUpdate(
              userId,
              {
                $pull: {
                  voucherClaims: { voucherCode: voucher.code }
                }
              },
              { session, new: true }
            );
            console.log("✅ Voucher removed successfully (last claim used)");
          }
        }
      }

      // 🎉 COMMIT TRANSACTION - Tất cả thay đổi được áp dụng
      await session.commitTransaction();
      console.log("✅ Transaction committed successfully");

      // ==========================================
      // Các xử lý sau khi commit (không cần rollback)
      // ==========================================

      // Schedule job with Agenda (if available)
      try {
        if (agenda) {
          await agenda.schedule("in 1 minute", "process pending order", {
            orderId: order._id,
          });
          console.log(`Job scheduled for order ${order._id} in 1 minute.`);
        }
      } catch (agendaError) {
        console.warn(
          "⚠️ Agenda scheduling failed (non-critical):",
          agendaError.message
        );
      }

      console.log("✅ ORDER - Order saved successfully:", order._id);

      // Notification
      const notificationMessage = `Đơn hàng #${order._id} của bạn đã được tạo thành công!`;
      try {
        const newNotification = new Notification({
          user: userId,
          message: notificationMessage,
          link: `/orders/tracking/${order._id}`,
        });
        await newNotification.save();
        sendNotificationToUser(io, userId, "new_notification", newNotification);
      } catch (notifError) {
        console.warn(
          "⚠️ Notification failed (non-critical):",
          notifError.message
        );
      }

      // Clear user's cart after order creation
      try {
        const cart = await Cart.findOne({ user: userId });
        if (cart && cart.items.length > 0) {
          const orderedProductIds = orderItems.map((item) =>
            item.product.toString()
          );

          const remainingItems = cart.items.filter(
            (cartItem) =>
              !orderedProductIds.includes(cartItem.product.toString())
          );

          cart.items = remainingItems;
          await cart.save();

          console.log(
            "🛒 ORDER - Removed ordered items from cart, remaining items:",
            remainingItems.length
          );
        }
      } catch (cartError) {
        console.warn(
          "⚠️ ORDER - Cart update failed (not critical):",
          cartError.message
        );
      }

      // Populate order để trả về đầy đủ thông tin
      const populatedOrder = await Order.findById(order._id)
        .populate("items.product", "name price images")
        .populate("user", "name email");

      res.status(201).json({
        message: "Order created successfully",
        order: populatedOrder,
        success: true,
      });
    } catch (error) {
      // ❌ ROLLBACK nếu có lỗi - Tất cả thay đổi bị hủy
      await session.abortTransaction();
      console.error("❌ Transaction aborted:", error.message);

      // Xử lý các lỗi cụ thể
      if (error.message.includes("Insufficient stock")) {
        return res.status(400).json({
          message: error.message,
          code: "OUT_OF_STOCK",
        });
      }

      if (error.message.includes("loyalty points")) {
        return res.status(400).json({
          message: "Insufficient loyalty points",
          code: "INSUFFICIENT_POINTS",
        });
      }

      if (error.message.includes("Payment")) {
        return res.status(400).json({
          message: "Payment verification failed",
          code: "PAYMENT_FAILED",
          error: error.message,
        });
      }

      // Lỗi chung
      return res.status(500).json({
        message: "Failed to create order",
        code: "ORDER_CREATION_FAILED",
        error: error.message,
      });
    } finally {
      // 🔒 LUÔN LUÔN đóng session
      session.endSession();
    }
  });

  // Get user's orders
  getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    // Kiểm tra và tạo notification cho các đơn hàng "shipped" chưa có notification
    try {
      const shippedOrders = orders.filter(order => order.status === "shipped");
      if (shippedOrders.length > 0) {
        const io = req.app.locals.io;
        const sendNotificationToUser = req.app.locals.sendNotificationToUser;

        for (const order of shippedOrders) {
          const existingNotification = await Notification.findOne({
            user: userId,
            orderId: order._id,
            type: "order_delivery_confirmation",
          });

          if (!existingNotification) {
            console.log(`📦 Creating notification for shipped order ${order._id}`);

            const notificationMessage = "Bạn đã nhận đơn hàng chưa?";
            const newNotification = new Notification({
              user: userId,
              message: notificationMessage,
              link: `/orders/tracking/${order._id}`,
              orderId: order._id,
              type: "order_delivery_confirmation",
              actions: {
                confirm: "Xác nhận",
                cancel: "Chưa nhận hàng",
              },
            });

            await newNotification.save();
            console.log(`✅ Notification created: ${newNotification._id}`);

            // Gửi notification qua WebSocket nếu có
            if (io && sendNotificationToUser) {
              try {
                const notificationData = {
                  ...newNotification.toObject(),
                  orderId: order._id,
                };
                await sendNotificationToUser(io, userId, "new_notification", notificationData);
                console.log(`✅ Notification sent via WebSocket for order ${order._id}`);
              } catch (wsError) {
                console.warn(`⚠️ Could not send WebSocket notification:`, wsError.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking shipped notifications:", error);
      // Không throw error, chỉ log để không ảnh hưởng đến việc lấy orders
    }

    // Đảm bảo các trường voucher và điểm được trả về đầy đủ
    const ordersWithDetails = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        voucher: orderObj.voucher || null,
        voucherDiscount: orderObj.voucherDiscount || 0,
        usedPoints: orderObj.usedPoints || 0,
        usedPointsAmount: orderObj.usedPointsAmount || 0,
      };
    });

    res.status(200).json({
      orders: ordersWithDetails,
      count: ordersWithDetails.length,
    });
  });

  // Get order by ID for user
  getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate({
        path: "items.product",
        select: "name price images description"
      })
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập đơn hàng này"
      });
    }

    // Convert to object and ensure all fields are included
    const orderObject = order.toObject();

    // Đảm bảo các trường voucher và điểm LUÔN có giá trị (xử lý đơn hàng cũ)
    const voucherDiscount = (orderObject.voucherDiscount !== undefined && orderObject.voucherDiscount !== null)
      ? orderObject.voucherDiscount
      : 0;
    const usedPoints = (orderObject.usedPoints !== undefined && orderObject.usedPoints !== null)
      ? orderObject.usedPoints
      : 0;
    const usedPointsAmount = (orderObject.usedPointsAmount !== undefined && orderObject.usedPointsAmount !== null)
      ? orderObject.usedPointsAmount
      : 0;
    const voucher = orderObject.voucher || null;

    res.status(200).json({
      success: true,
      order: {
        ...orderObject,
        voucher,
        voucherDiscount,
        usedPoints,
        usedPointsAmount,
        items: order.items.map(item => ({
          ...item.toObject(),
          product: item.product
        }))
      }
    });
  });

  // Cancel an order
  cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation of pending orders
    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel order that is not in pending status",
      });
    }

    // Restore product stocks
    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          product.soldCount -= item.quantity;
          await product.save();
        }
      })
    );

    // Default response data for points conversion
    let pointsConversionPerformed = false;
    let pointsAwarded = 0;
    let convertedAmount = 0;
    let newUserBalance;

    try {
      // Nếu đơn thanh toán MOMO, khi hủy sẽ quy đổi số tiền thành điểm
      if (String(order.paymentMethod) === "MOMO" || String(order.onlinePaymentInfo?.gateway || "").toUpperCase() === "MOMO") {
        // Tránh cộng trùng: kiểm tra đã có giao dịch quy đổi trước đó hay chưa
        const existingConversion = await PointTransaction.findOne({
          user: order.user,
          order: order._id,
          type: "EARNED",
          description: { $regex: "^(ORDER_CANCEL_CONVERT|MOMO_CANCEL_CONVERT)", $options: "i" },
        });

        if (!existingConversion) {
          // Lấy cấu hình điểm (mặc định 1 VND = 1 điểm)
          const configDoc = await Configuration.findOne({ key: "points_config" });
          const config = configDoc?.value || {
            pointsValue: 1, // 1 VND = 1 điểm
            silverThreshold: 1000,
            goldThreshold: 5000,
            pointsPerOrder: 1,
          };

          const calculateTier = (points) => {
            if (points >= config.goldThreshold) return "GOLD";
            if (points >= config.silverThreshold) return "SILVER";
            return "BRONZE";
          };

          // Số tiền quy đổi: nếu đã trả qua MoMo thì ưu tiên onlinePaymentInfo.amount, ngược lại dùng totalPrice
          convertedAmount =
            (order.onlinePaymentInfo?.amount && Number(order.onlinePaymentInfo.amount)) ||
            Number(order.totalPrice) ||
            0;

          pointsAwarded = Math.floor(convertedAmount / config.pointsValue);

          if (pointsAwarded > 0) {
            // Ghi lịch sử điểm
            await PointTransaction.create({
              user: order.user,
              type: "EARNED",
              points: pointsAwarded,
              description: `ORDER_CANCEL_CONVERT: Chuyển ${convertedAmount} VND thành ${pointsAwarded} điểm (đơn ${order._id})`,
              order: order._id,
            });

            // Cập nhật điểm cho user
            const user = await User.findById(order.user);
            if (user) {
              const currentBalance = user.loyaltyPoints?.balance || 0;
              newUserBalance = currentBalance + pointsAwarded;
              user.loyaltyPoints.balance = newUserBalance;
              user.loyaltyPoints.tier = calculateTier(newUserBalance);
              await user.save();
              pointsConversionPerformed = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Points conversion on cancel failed:", e?.message);
    }

    // Cancel the order and set payment status accordingly
    order.status = "cancelled";
    if (pointsConversionPerformed && order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    } else if (order.paymentStatus !== "paid") {
      order.paymentStatus = "unpaid";
    }
    await order.save();

    return res.status(200).json({
      message: pointsConversionPerformed
        ? "Order cancelled and converted amount to loyalty points"
        : "Order cancelled successfully",
      order,
      ...(pointsConversionPerformed
        ? { pointsAwarded, convertedAmount, newUserBalance }
        : {}),
    });
  });

  // ==================== ADMIN METHODS ====================

  // Get all orders for admin
  getAllOrdersAdmin = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      paymentMethod,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .populate("items.product", "name price images")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  });

  // Get order statistics for admin
  getOrderStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      paidOrders,
      unpaidOrders,
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: "pending" }),
      Order.countDocuments({ ...dateFilter, status: "processing" }),
      Order.countDocuments({ ...dateFilter, status: "shipped" }),
      Order.countDocuments({ ...dateFilter, status: "delivered" }),
      Order.countDocuments({ ...dateFilter, status: "cancelled" }),
      Order.aggregate([
        { $match: { ...dateFilter, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.countDocuments({ ...dateFilter, paymentStatus: "paid" }),
      Order.countDocuments({ ...dateFilter, paymentStatus: "unpaid" }),
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        totalRevenue: totalRevenue[0]?.total || 0,
        paymentStatus: {
          paid: paidOrders,
          unpaid: unpaidOrders,
        },
      },
    });
  });

  // Get order by ID for admin
  getOrderByIdAdmin = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price images description");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  });

  // Handle delivery confirmation from user
  handleDeliveryConfirmation = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { action } = req.body; // "confirm" hoặc "not_received"

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Kiểm tra user có quyền truy cập đơn hàng này không
    if (req.user && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this order",
      });
    }

    // Kiểm tra order phải ở trạng thái "shipped"
    if (order.status !== "shipped") {
      return res.status(400).json({
        success: false,
        message: "Order is not in shipped status",
      });
    }

    const io = req.app.locals.io;
    const sendNotificationToUser = req.app.locals.sendNotificationToUser;
    const agenda = req.app.locals.agenda;

    if (action === "confirm") {
      // User xác nhận đã nhận hàng -> chuyển sang "delivered"
      order.status = "delivered";
      await order.save();

      // Nếu thanh toán COD thì tự động chuyển sang "đã thanh toán"
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "paid";
        await order.save();
      }

      // Đánh dấu notification là đã đọc
      await Notification.updateMany(
        {
          user: order.user,
          orderId: order._id,
          type: "order_delivery_confirmation",
          read: false,
        },
        { read: true }
      );

      // Gửi notification xác nhận
      const confirmNotification = new Notification({
        user: order.user,
        message: `Đơn hàng #${order._id} đã được xác nhận giao thành công!`,
        link: `/orders/tracking/${order._id}`,
        orderId: order._id,
      });
      await confirmNotification.save();

      if (io && sendNotificationToUser) {
        sendNotificationToUser(io, order.user, "new_notification", {
          ...confirmNotification.toObject(),
        });
      }

      return res.status(200).json({
        success: true,
        message: "Order confirmed as delivered",
        order,
      });
    } else if (action === "not_received") {
      // User chưa nhận hàng -> schedule notification sau 2 phút
      if (agenda) {
        await agenda.schedule("in 2 minutes", "resend delivery notification", {
          orderId: order._id,
          userId: order.user.toString(),
        });
        console.log(
          `📅 Scheduled reminder notification for order ${order._id} in 2 minutes`
        );
      }

      return res.status(200).json({
        success: true,
        message: "Reminder notification will be sent in 2 minutes",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'confirm' or 'not_received'",
      });
    }
  });

  // Update order status
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status if provided
    if (status) {
      order.status = status;
    }

    // Update payment status if provided
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Send notification to user
    try {
      const io = req.app.locals.io;
      const sendNotificationToUser = req.app.locals.sendNotificationToUser;
      const agenda = req.app.locals.agenda;

      console.log("🔔 Notification Debug - Order Status Update:");
      console.log("  - Order ID:", order._id);
      console.log("  - New Status:", status);
      console.log("  - User ID:", order.user);
      console.log("  - IO available:", !!io);
      console.log("  - sendNotificationToUser available:", !!sendNotificationToUser);

      if (io && sendNotificationToUser && status) {
        // Nếu status = "shipped", gửi notification đặc biệt với action buttons
        if (status === "shipped") {
          console.log("📦 Status is 'shipped', creating delivery confirmation notification...");

          const notificationMessage = "Bạn đã nhận đơn hàng chưa?";
          const newNotification = new Notification({
            user: order.user,
            message: notificationMessage,
            link: `/orders/tracking/${order._id}`,
            orderId: order._id,
            type: "order_delivery_confirmation",
            actions: {
              confirm: "Xác nhận",
              cancel: "Chưa nhận hàng",
            },
          });

          await newNotification.save();
          console.log("✅ Notification saved to database:", newNotification._id);

          // Gửi notification qua WebSocket với đầy đủ thông tin
          const notificationData = {
            ...newNotification.toObject(),
            orderId: order._id,
          };

          console.log("📤 Sending notification via WebSocket:", notificationData);
          await sendNotificationToUser(io, order.user, "new_notification", notificationData);
          console.log("✅ Notification sent via WebSocket");
        } else {
          // Notification thông thường cho các status khác
          console.log("📨 Sending normal notification for status:", status);
          await sendNotificationToUser(io, order.user, "order_status_update", {
            orderId: order._id,
            newStatus: status,
            message: `Đơn hàng #${order._id} của bạn đã được cập nhật sang trạng thái: ${status}`,
          });
        }
      } else {
        console.warn("⚠️ Cannot send notification - missing dependencies:");
        console.warn("  - IO:", !!io);
        console.warn("  - sendNotificationToUser:", !!sendNotificationToUser);
        console.warn("  - Status:", status);
      }
    } catch (notificationError) {
      console.error(
        "❌ Notification failed:",
        notificationError.message
      );
      console.error("❌ Stack trace:", notificationError.stack);
    }

    const updatedOrder = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price images");

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  });
}

export default new OrderController();