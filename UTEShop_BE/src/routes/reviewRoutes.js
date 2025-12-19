import { Router } from "express";
import {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    adminDeleteReview,
    getUserReview,
    checkOrderReviewed,
    checkProductReviewed,
    getLatestReviews
} from "../controllers/ReviewController.js";
import { requireAuth, admin } from "../middlewares/auth.js";

const router = Router();

// Specific routes FIRST (before dynamic :productId routes)
router.get("/latest/home", getLatestReviews);
router.get("/order/:orderId/check", requireAuth, checkOrderReviewed);
router.get("/order/:orderId/product/:productId/check", requireAuth, checkProductReviewed);

// Admin route
router.delete("/admin/:reviewId", requireAuth, admin, adminDeleteReview);

// Dynamic routes LAST
router.post("/:productId", requireAuth, createReview);
router.get("/:productId", getProductReviews);
router.get("/:productId/user", requireAuth, getUserReview);
router.put("/:reviewId", requireAuth, updateReview);
router.delete("/:reviewId", requireAuth, deleteReview);

export default router;
