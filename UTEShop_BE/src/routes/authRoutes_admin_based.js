import { Router } from "express";
import { z } from "zod";

// Middlewares
import validate from "../middlewares/validateRequest.js";
import { requireAuth } from "../middlewares/auth.js";

// Controllers (import từ file controller admin-based)
import {
    registerRequestOtp,
    registerVerify,
    resetRequestOtp,
    resetVerify,
    login,
    me,
    refreshTokenController,
    logout,
    testEmailEndpoint, // Test email endpoint
} from "../controllers/AuthController_admin_based.js";

const router = Router();

// ------------------- Zod Validation Schemas -------------------

const emailSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

const registerVerifySchema = z.object({
    body: z.object({
        email: z.string().email(),
        code: z.string().length(6),
        name: z.string().min(2),
        password: z.string().min(6),
    }),
});

const resetVerifySchema = z.object({
    body: z.object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});

const testEmailSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

// ------------------- Route Definitions -------------------

// --- OTP & Registration Routes ---
router.post("/register/request-otp", validate(emailSchema), registerRequestOtp);
router.post("/register/verify", validate(registerVerifySchema), registerVerify);

// --- Password Reset Routes ---
router.post("/forgot/request-otp", validate(emailSchema), resetRequestOtp);
router.post("/forgot/verify", validate(resetVerifySchema), resetVerify);

// --- Standard Auth Routes ---
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);
router.post("/refresh", refreshTokenController);
router.post("/logout", logout);

// --- Test Email Route (chỉ cho development) ---
if (process.env.NODE_ENV === 'development') {
    router.post("/test-email", validate(testEmailSchema), testEmailEndpoint);
    console.log('📧 Test email endpoint enabled at POST /api/auth/test-email (Admin-based)');
}

export default router;