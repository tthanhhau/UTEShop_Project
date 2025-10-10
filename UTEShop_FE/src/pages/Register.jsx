// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestRegisterOtp,
  verifyRegister,
  clearFeedback,
} from "../features/auth/authSlice";
import OtpInput from "../components/utils/OtpInput";

export default function Register() {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((s) => s.auth);

  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + info
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
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
      // PHẢI truyền object { email }
      await dispatch(requestRegisterOtp({ email })).unwrap();
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
    if (!name.trim()) return setLocalError("Vui lòng nhập họ tên.");
    if (password.length < 6) return setLocalError("Mật khẩu tối thiểu 6 ký tự.");

    try {
      await dispatch(verifyRegister({ email, code, name, password })).unwrap();
      // TODO: điều hướng nếu cần, ví dụ:
      // navigate("/login");
    } catch (err) {
      const msg =
        err?.errors?.[0]?.msg ||
        err?.message ||
        "Xác minh OTP thất bại. Vui lòng thử lại.";
      setLocalError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-700/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center mb-6">Đăng ký</h1>

          {/* Thông báo thành công từ server */}
          {message && (
            <div
              className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-800"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {/* Lỗi server */}
          {error && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {typeof error === "string" ? error : error?.message || "Có lỗi xảy ra"}
            </div>
          )}

          {/* Lỗi cục bộ */}
          {localError && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {localError}
            </div>
          )}

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

              {/* Divider “hoặc” */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-500">hoặc</span>
                </div>
              </div>

             

              <div className="mt-2 text-center text-sm">
                Đã có tài khoản?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Đăng nhập
                </a>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <span className="mb-1 block text-sm font-medium">Mã OTP</span>
                <OtpInput value={code} onChange={setCode} />
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Họ tên</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (>= 6 ký tự)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  autoComplete="new-password"
                  minLength={6}
                />
              </label>

              <button
                type="submit"
                disabled={loading || code.length !== 6 || !name || password.length < 6}
                className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
              >
                {loading ? "Đang xác minh..." : "Hoàn tất đăng ký"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                  dispatch(clearFeedback());
                }}
                className="w-full rounded-lg border border-gray-300 py-2.5 font-medium hover:bg-gray-50"
              >
                Dùng email khác
              </button>

              <div className="mt-2 text-center text-sm">
                Đã có tài khoản?{" "}
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
