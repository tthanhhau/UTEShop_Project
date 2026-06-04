import ChatConversation from "../models/chatConversation.js";
import ChatMessage from "../models/chatMessage.js";
import User from "../models/user.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ==================== CUSTOMER ENDPOINTS ====================

// Lấy hoặc tự động tạo cuộc hội thoại của khách hàng hiện tại
export const getMeConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let conversation = await ChatConversation.findOne({ customer: userId })
    .populate("customer", "name email");

  if (!conversation) {
    conversation = await ChatConversation.create({
      customer: userId,
      lastMessage: "Chào bạn! Tôi có thể giúp gì cho bạn?",
      lastMessageAt: new Date()
    });

    // Tạo tin nhắn chào mừng mặc định từ hệ thống/admin
    // Chúng ta có thể dùng chính tài khoản admin hoặc chỉ là tin nhắn đầu tiên
    // Tìm 1 admin bất kỳ hoặc dùng ID của hệ thống làm sender
    const adminUser = await User.findOne({ role: "admin" });
    const senderId = adminUser ? adminUser._id : userId; // fallback nếu chưa có admin

    await ChatMessage.create({
      conversationId: conversation._id,
      sender: senderId,
      senderRole: "admin",
      message: "Chào bạn! Tôi có thể giúp gì cho bạn?"
    });

    conversation = await ChatConversation.findById(conversation._id)
      .populate("customer", "name email");
  }

  // Khi khách hàng mở khung chat, reset unreadCountCustomer về 0
  conversation.unreadCountCustomer = 0;
  await conversation.save();

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// Lấy danh sách tin nhắn của cuộc hội thoại khách hàng hiện tại
export const getMeMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversation = await ChatConversation.findOne({ customer: userId });
  if (!conversation) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const messages = await ChatMessage.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .populate("sender", "name email");

  res.status(200).json({
    success: true,
    data: messages
  });
});

// Khách hàng gửi tin nhắn lên Admin
export const sendMeMessage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { message, product } = req.body;

  if (!message && !product) {
    return res.status(400).json({
      success: false,
      message: "Nội dung tin nhắn hoặc sản phẩm đính kèm là bắt buộc"
    });
  }

  let conversation = await ChatConversation.findOne({ customer: userId });
  if (!conversation) {
    conversation = await ChatConversation.create({
      customer: userId,
      lastMessage: message || "[Sản phẩm]",
      lastMessageAt: new Date()
    });
  }

  // Tạo tin nhắn mới
  const chatMessage = await ChatMessage.create({
    conversationId: conversation._id,
    sender: userId,
    senderRole: "customer",
    message: message || `Tôi muốn được tư vấn về sản phẩm: ${product.name}`,
    product: product || null
  });

  // Cập nhật thông tin cuộc hội thoại
  conversation.lastMessage = message || `[Sản phẩm] ${product.name}`;
  conversation.lastMessageAt = new Date();
  conversation.unreadCountAdmin += 1;
  await conversation.save();

  const populatedMessage = await ChatMessage.findById(chatMessage._id)
    .populate("sender", "name email");

  // Phát tín hiệu realtime qua Socket.io
  const io = req.app.locals.io;
  if (io) {
    // Phát cho tất cả Admin đang kết nối
    io.to("admins").emit("receive_chat_message", {
      conversation,
      message: populatedMessage
    });
    // Phát cho chính khách hàng (trong trường hợp mở nhiều tab)
    io.to(`user_${userId}`).emit("receive_chat_message", {
      conversation,
      message: populatedMessage
    });
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});


// ==================== ADMIN ENDPOINTS ====================

// Lấy danh sách tất cả các hội thoại
export const getAdminConversations = asyncHandler(async (req, res) => {
  const conversations = await ChatConversation.find()
    .populate("customer", "name email phone")
    .sort({ lastMessageAt: -1 });

  res.status(200).json({
    success: true,
    data: conversations
  });
});

// Lấy tin nhắn của cuộc hội thoại cụ thể
export const getAdminMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await ChatConversation.findById(conversationId)
    .populate("customer", "name email phone");

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy cuộc hội thoại"
    });
  }

  // Đánh dấu đã đọc đối với admin
  conversation.unreadCountAdmin = 0;
  await conversation.save();

  const messages = await ChatMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "name email");

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages
    }
  });
});

// Admin gửi tin nhắn tới khách hàng
export const sendAdminMessage = asyncHandler(async (req, res) => {
  const adminId = req.user._id;
  const { conversationId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: "Nội dung tin nhắn không được để trống"
    });
  }

  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy cuộc hội thoại"
    });
  }

  const chatMessage = await ChatMessage.create({
    conversationId,
    sender: adminId,
    senderRole: "admin",
    message
  });

  // Cập nhật hội thoại
  conversation.lastMessage = message;
  conversation.lastMessageAt = new Date();
  conversation.unreadCountCustomer += 1;
  await conversation.save();

  const populatedMessage = await ChatMessage.findById(chatMessage._id)
    .populate("sender", "name email");

  // Phát tín hiệu realtime qua Socket.io
  const io = req.app.locals.io;
  if (io) {
    // Phát cho khách hàng
    io.to(`user_${conversation.customer}`).emit("receive_chat_message", {
      conversation,
      message: populatedMessage
    });
    // Phát cho toàn bộ Admin đang online để đồng bộ hóa
    io.to("admins").emit("receive_chat_message", {
      conversation,
      message: populatedMessage
    });
  }

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// Đánh dấu đã đọc
export const markAsReadAdmin = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy cuộc hội thoại"
    });
  }

  conversation.unreadCountAdmin = 0;
  await conversation.save();

  res.status(200).json({
    success: true,
    message: "Đã đánh dấu đã đọc"
  });
});
