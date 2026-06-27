import ChatbotService from "./ChatbotService.js";
import ChatHistory from "../models/ChatHistory.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import KaggleService from "./KaggleService.js";

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
    "Quần jean nam",
    "Tư vấn size cho mình",
    "Phối đồ đi chơi",
    "Chính sách đổi trả"
  ];

  return res.json({
    success: true,
    data: suggestions
  });
});

// POST /api/chatbot/stream - Streaming response (SSE)
export const streamMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user?._id || null;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tin nhắn" });
  }

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const messages = [
      { role: "system", content: "Bạn là trợ lý AI bán hàng của UTEShop. Trả lời bằng tiếng Việt có dấu, thân thiện." },
      { role: "user", content: message.trim() }
    ];

    for await (const chunk of KaggleService.chatStream(messages)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: [DONE]\n\n`);
  } catch (error) {
    console.error("Stream error:", error);
    res.write(`data: ${JSON.stringify({ error: "AI đang bận, thử lại sau." })}\n\n`);
  } finally {
    res.end();
  }
});

// GET /api/chatbot/health - Kiểm tra AI
export const healthCheck = asyncHandler(async (req, res) => {
  const aiStatus = await KaggleService.healthCheck();

  return res.json({
    success: true,
    ollama: aiStatus,
    status: aiStatus.ok ? "ready" : "offline"
  });
});
