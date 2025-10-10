import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginUser } from '../../features/auth/authSlice';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (token && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [token, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const fillDemoCredentials = () => {
    setFormData(prev => ({
      ...prev,
      email: 'admin@uteshop.com',
      password: 'Admin@123'
    }));

    // Add animation effect
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach((input, index) => {
      setTimeout(() => {
        input.style.transform = 'scale(1.02)';
        input.style.borderColor = '#667eea';
        setTimeout(() => {
          input.style.transform = 'scale(1)';
          input.style.borderColor = '';
        }, 200);
      }, index * 100);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await dispatch(loginUser({
        email: formData.email,
        password: formData.password
      })).unwrap();

      // Check if user is admin
      if (result.user.role !== 'admin') {
        setError('Bạn không có quyền truy cập vào trang quản trị!');
        setIsLoading(false);
        return;
      }

      // Show success animation
      setShowSuccess(true);
      
      // Simulate progress and redirect
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }, 2500);

    } catch (error) {
      setError(error.message || 'Email hoặc mật khẩu không chính xác!');
      
      // Shake animation
      const form = document.getElementById('loginForm');
      if (form) {
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          form.style.animation = '';
        }, 500);
      }
    } finally {
      if (!showSuccess) {
        setIsLoading(false);
      }
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <i className="fas fa-check text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Đăng nhập thành công!</h3>
              <p className="text-gray-600 mb-4">Đang chuyển hướng đến dashboard...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-2000"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/5 left-1/10 w-32 h-32 bg-white rounded-full opacity-10 animate-float"></div>
        <div className="absolute top-3/5 right-1/10 w-24 h-24 bg-white rounded-lg opacity-10 animate-float-delayed"></div>
        <div className="absolute bottom-1/5 left-1/5 w-40 h-40 bg-white rounded-full opacity-10 animate-float-delayed-2"></div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <i className="fas fa-crown text-2xl text-purple-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Fashion Admin</h1>
          <p className="text-purple-100">Đăng nhập vào hệ thống quản trị</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form id="loginForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-envelope mr-2 text-purple-600"></i>Email
              </label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                placeholder="admin@uteshop.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-lock mr-2 text-purple-600"></i>Mật khẩu
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Quên mật khẩu?
              </a>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Đăng nhập
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fab fa-google text-red-500 mr-2"></i>
                Google
              </button>
              <button 
                type="button" 
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fab fa-microsoft text-blue-500 mr-2"></i>
                Microsoft
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-2">
              <i className="fas fa-info-circle mr-1"></i>Tài khoản demo:
            </h4>
            <div className="text-sm text-purple-700 space-y-1">
              <p><strong>Email:</strong> admin@uteshop.com</p>
              <p><strong>Mật khẩu:</strong> Admin@123</p>
            </div>
            <button 
              type="button"
              onClick={fillDemoCredentials}
              className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Điền tự động
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-100">
          <p className="text-sm">© 2024 Fashion Admin. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-700">Đang đăng nhập...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLogin;
