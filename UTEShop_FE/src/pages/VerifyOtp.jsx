// src/pages/VerifyOtp.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosConfig";
import OtpInput from "../components/utils/OtpInput";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Nếu không có email, redirect về trang đăng ký
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      return setError("Mã OTP phải gồm 6 ký tự.");
    }

    try {
      setLoading(true);
      await axios.post("/auth/register/verify-otp", { email, code });
      
      // OTP đúng, chuyển sang trang hoàn tất đăng ký
      navigate("/complete-registration", { state: { email } });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Mã OTP không đúng. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-700/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center mb-2">Xác minh OTP</h1>
          <p className="text-center text-sm text-gray-600 mb-6">
            Mã OTP đã được gửi đến <span className="font-semibold">{email}</span>
          </p>

          {error && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <span className="mb-1 block text-sm font-medium">Mã OTP</span>
              <OtpInput value={code} onChange={setCode} />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
            >
              {loading ? "Đang xác minh..." : "Xác nhận"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
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
        </div>
      </div>
    </div>
  );
}
