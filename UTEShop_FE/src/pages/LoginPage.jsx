import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";
import TextField from "../components/ui/TextField";
import { Button } from "../components/ui/button";
import { FaFacebook } from "react-icons/fa";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import axios from "axios";
//import bgImage from "/Logo HCMUTE-Corel-white background.jpg"; // 📌 import ảnh từ assets

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
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Kiểm tra độ dài tối thiểu 8 ký tự
    return password.length >= 8;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    // Chỉ validate nếu đã submit ít nhất 1 lần
    if (hasSubmitted) {
      if (value && !validateEmail(value)) {
        setEmailError("Email không đúng định dạng");
      } else {
        setEmailError("");
      }
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    // Chỉ validate nếu đã submit ít nhất 1 lần
    if (hasSubmitted) {
      if (value && !validatePassword(value)) {
        setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    
    let hasError = false;
    
    if (!validateEmail(email)) {
      setEmailError("Email không đúng định dạng");
      hasError = true;
    } else {
      setEmailError("");
    }
    
    if (!validatePassword(password)) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      hasError = true;
    } else {
      setPasswordError("");
    }
    
    if (hasError) return;
    
    dispatch(loginUser({ email, password }));
  };

  // Load Facebook SDK
  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || '1234567890', // Thay bằng Facebook App ID của bạn
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load SDK script
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleFacebookLogin = () => {
    window.FB.login(function (response) {
      if (response.authResponse) {
        // User logged in successfully
        const accessToken = response.authResponse.accessToken;

        // Get user info
        window.FB.api('/me', { fields: 'id,name,email,picture' }, async function (userInfo) {
          try {
            // Send to backend for authentication
            const result = await axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/facebook`,
              {
                accessToken,
                userID: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture?.data?.url
              }
            );

            // Save token and user info to sessionStorage (same as Redux)
            if (result.data.token) {
              sessionStorage.setItem('token', result.data.token);
              sessionStorage.setItem('refreshToken', result.data.refreshToken);
              sessionStorage.setItem('user', JSON.stringify(result.data.user));

              // Manually update Redux store by dispatching loginUser.fulfilled
              dispatch({
                type: 'auth/login/fulfilled',
                payload: {
                  token: result.data.token,
                  refreshToken: result.data.refreshToken,
                  user: result.data.user
                }
              });

              // Redirect to home or previous page
              const from = location.state?.from?.pathname || "/";
              navigate(from, { replace: true });
            }
          } catch (error) {
            console.error('Facebook login error:', error);
            alert('Đăng nhập Facebook thất bại. Vui lòng thử lại.');
          }
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'public_profile,email' });
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
      style={{ backgroundImage: "url('/Logo HCMUTE-Corel-white background.jpg')" }}
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
            type="button"
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg py-2 hover:bg-[#166FE5] transition"
          >
            <FaFacebook className="text-xl" />
            <span className="text-sm font-medium">
              Đăng nhập với Facebook
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
