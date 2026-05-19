import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import UserController from "../controllers/UserController.js";
import upload from "../middlewares/cloudinaryUpload.js";
import { claimReviewReward, getUserVouchers } from '../controllers/rewardController.js';
import { getNotifications, markNotificationsAsRead, testCreateShippedNotification } from '../controllers/notificationController.js';
const router = express.Router();

// Route lấy profile (protected, cần token)
router.get("/profile", requireAuth, UserController.getProfile);
router.put("/profile", requireAuth, UserController.updateProfile);
router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  UserController.uploadUserAvatar
);
router.put('/password', requireAuth, UserController.changePassword);
router.post('/claim-reward', requireAuth, claimReviewReward);
router.get('/vouchers', requireAuth, getUserVouchers);

router.get('/notifications', requireAuth, (req, res, next) => {
  console.log("🔔 [ROUTE] /notifications route hit");
  console.log("🔔 [ROUTE] req.user:", req.user);
  next();
}, getNotifications);
router.post('/notifications/mark-read', requireAuth, markNotificationsAsRead);
router.post('/notifications/test-shipped', requireAuth, testCreateShippedNotification); // Test endpoint
export default router;
