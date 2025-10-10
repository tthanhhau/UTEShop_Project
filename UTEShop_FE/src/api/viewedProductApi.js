import api from './axiosConfig.js';

// Thêm sản phẩm vào danh sách đã xem
export const addViewedProduct = async (productId) => {
    try {
        const response = await api.post(`/viewed-products/${productId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Lấy danh sách sản phẩm đã xem
export const getViewedProducts = async (page = 1, limit = 12) => {
    try {
        const response = await api.get(`/viewed-products?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Xóa sản phẩm khỏi danh sách đã xem
export const removeViewedProduct = async (productId) => {
    try {
        const response = await api.delete(`/viewed-products/${productId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
