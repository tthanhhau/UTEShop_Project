// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestResetOtp,
  verifyReset,
  clearFeedback,
} from "../features/auth/authSlice";
import OtpInput from "../components/utils/OtpInput";

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((s) => s.auth);

  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu mới
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  // Clear feedback khi rời trang
  useEffect(() => {
    return () => {
      dispatch(clearFeedback());
    };
  }, [dispatch]);

  // Clear khi đổi step
  useEffect(() => {
    setLocalError(null);
    dispatch(clearFeedback());
  }, [step, dispatch]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email) return setLocalError("Vui lòng nhập email.");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return setLocalError("Email không hợp lệ.");

    try {
      // Quan trọng: truyền object { email }
      await dispatch(requestResetOtp({ email })).unwrap();
      setStep(2);
    } catch (err) {
      const msg =
        err?.errors?.[0]?.msg ||
        err?.message ||
        "Không thể gửi OTP. Vui lòng thử lại.";
      setLocalError(msg);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (code.length !== 6) return setLocalError("Mã OTP phải gồm 6 ký tự.");
    if (newPassword.length < 6)
      return setLocalError("Mật khẩu mới tối thiểu 6 ký tự.");

    try {
      await dispatch(verifyReset({ email, code, newPassword })).unwrap();
      // TODO: điều hướng sang /login nếu muốn
      // navigate("/login");
    } catch (err) {
      const msg =
        err?.errors?.[0]?.msg ||
        err?.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      setLocalError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-700/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center mb-6">
            Quên mật khẩu
          </h1>

          {/* Thông báo thành công từ server */}
          {message && (
            <div
              className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-800"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {/* Lỗi server từ Redux */}
          {error && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {typeof error === "string" ? error : error?.message || "Có lỗi xảy ra"}
            </div>
          )}

          {/* Lỗi cục bộ (client-side) */}
          {localError && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {localError}
            </div>
          )}

          {/* STEP 1: nhập email gửi OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  autoComplete="email"
                />
              </label>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
              >
                {loading ? "Đang gửi..." : "Gửi OTP"}
              </button>

              <div className="mt-2 text-center text-sm">
                Nhớ mật khẩu rồi?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Đăng nhập
                </a>
              </div>
            </form>
          )}

          {/* STEP 2: nhập OTP + mật khẩu mới */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <span className="mb-1 block text-sm font-medium">Mã OTP</span>
                <OtpInput value={code} onChange={setCode} />
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Mật khẩu mới
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (>= 6 ký tự)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  autoComplete="new-password"
                  minLength={6}
                />
              </label>

              <button
                type="submit"
                disabled={loading || code.length !== 6 || newPassword.length < 6}
                className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
              >
                {loading ? "Đang xác minh..." : "Đổi mật khẩu"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  setNewPassword("");
                  dispatch(clearFeedback());
                }}
                className="w-full rounded-lg border border-gray-300 py-2.5 font-medium hover:bg-gray-50"
              >
                Gửi lại email khác
              </button>

              <div className="mt-2 text-center text-sm">
                Nhớ mật khẩu?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Đăng nhập
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
