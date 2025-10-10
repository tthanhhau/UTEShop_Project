import express from "express";
import { requireAuth, admin } from "../middlewares/auth.js";
import User from "../models/user.js";
import UserController from "../controllers/UserController.js";
import upload from "../middlewares/cloudinaryUpload.js";
import { claimReviewReward, getUserVouchers } from '../controllers/rewardController.js';
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';
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

// Admin routes
router.get('/admin/customers', requireAuth, admin, UserController.getAllCustomers);
router.get('/admin/customers/:customerId/orders', requireAuth, admin, UserController.getCustomerOrderHistory);

router.get('/notifications', requireAuth, getNotifications);
router.post('/notifications/mark-read', requireAuth, markNotificationsAsRead);
export default router;
