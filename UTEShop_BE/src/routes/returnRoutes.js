import express from "express";
import { protect } from "../middlewares/auth.js";
import {
    createReturnRequest,
    getUserReturnRequests,
    checkReturnEligibility,
} from "../controllers/ReturnController.js";

const router = express.Router();

// User routes
router.post("/", protect, createReturnRequest);
router.get("/my-requests", protect, getUserReturnRequests);
router.get("/check/:orderId", protect, checkReturnEligibility);

export default router;
