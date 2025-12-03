import axios from "axios";

// Tạo một instance của Axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // Thay bằng baseURL của API
});

// Thêm một request interceptor
api.interceptors.request.use(
  (config) => {
    // Lấy token từ sessionStorage
    const token = sessionStorage.getItem("token");

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
    // Nếu nhận được lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;

      // Kiểm tra xem mã lỗi có phải là lỗi liên quan đến token hay không
      if (['TOKEN_EXPIRED', 'INVALID_TOKEN', 'NO_TOKEN'].includes(errorCode)) {

        // Xóa toàn bộ thông tin người dùng khỏi sessionStorage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken');

        // Chỉ chuyển hướng nếu không phải là request đến trang auth
        // và không phải đang ở trang login để tránh vòng lặp
        const isAuthRequest = error.config?.url?.includes('/auth/');

        if (!isAuthRequest && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;