import { Router } from "express";
import { sendMessage, getSuggestions, getChatHistory, mergeChatHistory } from "./ChatbotController.js";
import { optionalAuth, protect } from "../middlewares/auth.js";

const router = Router();

// POST /api/chatbot/message - Gửi tin nhắn
router.post("/message", optionalAuth, sendMessage);

// GET /api/chatbot/history - Lấy lịch sử chat
router.get("/history", optionalAuth, getChatHistory);

// POST /api/chatbot/merge - Merge guest chat vào user khi đăng nhập
router.post("/merge", protect, mergeChatHistory);

// GET /api/chatbot/suggestions - Lấy gợi ý câu hỏi
router.get("/suggestions", getSuggestions);

export default router;
