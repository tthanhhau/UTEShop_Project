import axios from "axios";

// Tạo một instance của Axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag để tránh gọi refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý 401 và auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh, đợi và retry
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem('refreshToken');

      // Nếu không có refresh token, logout
      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { token: newToken } = response.data;

        // Lưu token mới
        sessionStorage.setItem('token', newToken);

        // Cập nhật header cho request gốc
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Xử lý các request đang đợi
        processQueue(null, newToken);

        isRefreshing = false;

        // Retry request gốc với token mới
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh thất bại, logout
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Hàm logout
function handleLogout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('refreshToken');

  // Chỉ redirect nếu không ở trang login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default api;
