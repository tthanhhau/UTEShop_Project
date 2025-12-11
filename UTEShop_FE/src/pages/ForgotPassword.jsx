// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestResetOtp, clearFeedback } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState(null);

  // Clear feedback khi rời trang
  useEffect(() => {
    return () => {
      dispatch(clearFeedback());
    };
  }, [dispatch]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email) return setLocalError("Vui lòng nhập email.");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return setLocalError("Email không hợp lệ.");

    try {
      await dispatch(requestResetOtp({ email })).unwrap();
      // Chuyển sang trang xác minh OTP
      navigate("/verify-reset-otp", { state: { email } });
    } catch (err) {
      const msg =
        err?.errors?.[0]?.msg ||
        err?.message ||
        "Không thể gửi OTP. Vui lòng thử lại.";
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

          {message && (
            <div
              className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-800"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {typeof error === "string" ? error : error?.message || "Có lỗi xảy ra"}
            </div>
          )}

          {localError && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {localError}
            </div>
          )}

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
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>

            <div className="mt-2 text-center text-sm">
              Nhớ mật khẩu rồi?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Đăng nhập
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
