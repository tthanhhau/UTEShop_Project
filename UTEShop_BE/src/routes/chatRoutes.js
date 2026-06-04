import express from "express";
import {
  getMeConversation,
  getMeMessages,
  sendMeMessage,
  getAdminConversations,
  getAdminMessages,
  sendAdminMessage,
  markAsReadAdmin
} from "../controllers/chatController.js";
import { requireAuth, admin } from "../middlewares/auth.js";

const router = express.Router();

// Tất cả endpoints đều cần đăng nhập
router.use(requireAuth);

// ==================== KHÁCH HÀNG ENDPOINTS ====================
router.get("/me", getMeConversation);
router.get("/me/messages", getMeMessages);
router.post("/me/messages", sendMeMessage);

// ==================== ADMIN ENDPOINTS ====================
// Yêu cầu thêm quyền admin
router.get("/admin/conversations", admin, getAdminConversations);
router.get("/admin/conversations/:conversationId/messages", admin, getAdminMessages);
router.post("/admin/conversations/:conversationId/messages", admin, sendAdminMessage);
router.post("/admin/conversations/:conversationId/read", admin, markAsReadAdmin);

export default router;
