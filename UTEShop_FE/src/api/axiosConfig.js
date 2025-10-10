import axios from "axios";

// Tạo một instance của Axios
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Thay bằng baseURL của API
});

// Thêm một request interceptor
api.interceptors.request.use(
  (config) => {
    // Lấy token từ sessionStorage
    const token = sessionStorage.getItem("token");

    // Dòng console.log này hữu ích cho việc debug, được giữ lại từ nhánh dev_hau1
    console.log('🔍 Request interceptor - Token:', token ? 'Token exists' : 'No token');

    // Nếu token tồn tại, thêm nó vào header Authorization
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Xử lý lỗi request
    return Promise.reject(error);
  }
);

// Thêm response interceptor để xử lý lỗi xác thực (authentication)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log lỗi ra console để dễ debug
    console.log('🔍 Response interceptor - Error:', error.response?.data);
    
    // Nếu nhận được lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;

      // Kiểm tra xem mã lỗi có phải là lỗi liên quan đến token hay không
      if (['TOKEN_EXPIRED', 'INVALID_TOKEN', 'NO_TOKEN'].includes(errorCode)) {
        
        // Xóa toàn bộ thông tin người dùng khỏi sessionStorage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken');
        
        // Chuyển hướng người dùng về trang đăng nhập
        // Chỉ chuyển hướng nếu họ không ở sẵn trang đăng nhập để tránh vòng lặp
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;