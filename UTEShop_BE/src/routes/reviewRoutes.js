import { Router } from "express";
import {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    adminDeleteReview,
    getUserReview,
    checkOrderReviewed,
    getLatestReviews
} from "../controllers/ReviewController.js";
import { requireAuth, admin } from "../middlewares/auth.js";

const router = Router();

// Public / authenticated routes
router.post("/:productId", requireAuth, createReview);
router.get("/:productId", getProductReviews);
router.get("/:productId/user", requireAuth, getUserReview);
router.put("/:reviewId", requireAuth, updateReview);
router.delete("/:reviewId", requireAuth, deleteReview);
router.get("/order/:orderId/check", requireAuth, checkOrderReviewed);
router.get("/latest/home", getLatestReviews);

// Admin route
router.delete("/admin/:reviewId", requireAuth, admin, adminDeleteReview);

export default router;
