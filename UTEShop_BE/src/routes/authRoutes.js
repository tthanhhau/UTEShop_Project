import { Router } from "express";
import { z } from "zod";

// Middlewares
import validate from "../middlewares/validateRequest.js";
import { requireAuth } from "../middlewares/auth.js";

// Controllers (import tất cả các hàm cần thiết từ file controller đã hợp nhất)
import {
  registerRequestOtp,
  verifyOtpOnly,
  completeRegistration,
  registerVerify,
  resetRequestOtp,
  verifyResetOtpOnly,
  completePasswordReset,
  resetVerify,
  login,
  me,
  refreshTokenController,
  logout,
  facebookLogin,
} from "../controllers/AuthController.js";

const router = Router();

// ------------------- Zod Validation Schemas -------------------

const emailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
});

const completeRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  }),
});

const registerVerifySchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    name: z.string().min(2),
    password: z.string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    newPassword: z.string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
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
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  }),
});

const facebookLoginSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1),
    userID: z.string().min(1),
    name: z.string().optional(),
    email: z.string().email().optional(),
    picture: z.string().optional(),
  }),
});

// ------------------- Route Definitions -------------------

// --- OTP & Registration Routes ---
router.post("/register/request-otp", validate(emailSchema), registerRequestOtp);
router.post("/register/verify-otp", (req, res, next) => {
  console.log("✅ Route /register/verify-otp được gọi");
  next();
}, validate(verifyOtpSchema), verifyOtpOnly);
router.post("/register/complete", validate(completeRegistrationSchema), completeRegistration);
router.post("/register/verify", validate(registerVerifySchema), registerVerify); // Giữ lại để tương thích

// --- Password Reset Routes ---
router.post("/forgot/request-otp", validate(emailSchema), resetRequestOtp);
router.post("/forgot/verify-otp", validate(verifyOtpSchema), verifyResetOtpOnly);
router.post("/forgot/reset-password", validate(resetPasswordSchema), completePasswordReset);
router.post("/forgot/verify", validate(resetVerifySchema), resetVerify); // Giữ lại để tương thích

// --- Standard Auth Routes ---
router.post("/login", validate(loginSchema), login);
router.post("/facebook", validate(facebookLoginSchema), facebookLogin);
router.get("/me", requireAuth, me);
router.post("/refresh", refreshTokenController);
router.post("/logout", logout);

export default router;
