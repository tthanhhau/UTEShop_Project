// src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Nếu không có email, redirect về trang quên mật khẩu
  useEffect(() => {
    if (!email) {
      navigate("/forgot");
    }
  }, [email, navigate]);

  // Validate password
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) {
      errors.push("Mật khẩu phải có ít nhất 8 ký tự");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Phải có ít nhất 1 chữ hoa");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Phải có ít nhất 1 chữ thường");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push("Phải có ít nhất 1 ký tự đặc biệt");
    }
    return errors;
  };

  // Update password errors on change (chỉ sau khi submit)
  useEffect(() => {
    if (hasSubmitted && newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    }
  }, [newPassword, hasSubmitted]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setHasSubmitted(true);

    const pwdErrors = validatePassword(newPassword);
    if (pwdErrors.length > 0) {
      setPasswordErrors(pwdErrors);
      return setError(pwdErrors.join(", "));
    }

    try {
      setLoading(true);
      await axios.post("/auth/forgot/reset-password", { email, newPassword });

      // Đổi mật khẩu thành công, chuyển sang trang đăng nhập
      navigate("/login", {
        state: {
          message: "Đổi mật khẩu thành công! Vui lòng đăng nhập."
        }
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể đổi mật khẩu. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  // Password requirement component
  const PasswordRequirement = ({ met, text }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className={met ? "text-green-600" : "text-gray-400"}>
        {met ? "✓" : "○"}
      </span>
      <span className={met ? "text-green-600" : "text-gray-600"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-700/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-center mb-2">Đặt lại mật khẩu</h1>
          <p className="text-center text-sm text-gray-600 mb-6">
            Tạo mật khẩu mới cho <span className="font-semibold">{email}</span>
          </p>

          {error && hasSubmitted && (
            <div
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Mật khẩu mới</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (>= 8 ký tự)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-black"
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {/* Password requirements - chỉ hiện khi đang nhập */}
              {newPassword && !hasSubmitted && (
                <div className="mt-2 space-y-1">
                  <PasswordRequirement
                    met={newPassword.length >= 6}
                    text="Ít nhất 6 ký tự"
                  />
                  <PasswordRequirement
                    met={/[A-Z]/.test(newPassword)}
                    text="Ít nhất 1 chữ hoa"
                  />
                  <PasswordRequirement
                    met={/[a-z]/.test(newPassword)}
                    text="Ít nhất 1 chữ thường"
                  />
                  <PasswordRequirement
                    met={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)}
                    text="Ít nhất 1 ký tự đặc biệt (!@#$%...)"
                  />
                </div>
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
            >
              {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
            </button>

            <div className="mt-2 text-center text-sm">
              Nhớ mật khẩu?{" "}
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
