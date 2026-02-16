import express from "express";
import shippingController from "../controllers/ShippingController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// Public routes - Lấy thông tin địa chỉ
router.get("/provinces", shippingController.getProvinces);
router.get("/districts", shippingController.getDistricts);
router.get("/wards", shippingController.getWards);

// Protected routes - Yêu cầu đăng nhập
router.post("/calculate-fee", requireAuth, shippingController.calculateFee);
router.get("/track", requireAuth, shippingController.trackOrder);
router.get("/track/:orderId", requireAuth, shippingController.trackByOrderId);

// Admin routes - Tạo và quản lý đơn giao hàng
router.post("/create", requireAuth, shippingController.createShippingOrder);
router.post("/cancel/:orderId", requireAuth, shippingController.cancelShippingOrder);

export default router;
