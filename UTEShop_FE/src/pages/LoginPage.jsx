import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";
import TextField from "../components/ui/TextField";
import { Button } from "../components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
//import bgImage from "/public/biaLogin.jpg"; // 📌 import ảnh từ assets

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, user } = useSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Chỉ kiểm tra độ dài tối thiểu
    return password.length >= 6;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Email không đúng định dạng");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (value && !validatePassword(value)) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Email không đúng định dạng");
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError("Mật khẩu không được chứa ký tự đặc biệt");
      return;
    }
    dispatch(loginUser({ email, password }));
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
  };

  useEffect(() => {
    if (user) {
      // Lấy trang trước đó từ location state (nếu được redirect từ PrivateRoute)
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/biaLogin.jpg')" }}
    >
      {/* Overlay mờ đen phủ nền */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Form login giữ nguyên */}
      <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            error={emailError}
            type="email"
          />

          {/* Password field with eye icon */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <IoEyeOffOutline className="w-5 h-5" />
                ) : (
                  <IoEyeOutline className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition"
          >
            <FcGoogle className="text-xl" />
            <span className="text-sm font-medium text-gray-700">
              Đăng nhập với Google
            </span>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-sm text-center text-gray-600">
          <p>
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-indigo-600 hover:underline">
              Đăng ký ngay
            </a>
          </p>
          <p>
            <a href="/forgot" className="text-indigo-600 hover:underline">
              Quên mật khẩu?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
