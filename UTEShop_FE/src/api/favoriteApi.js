import api from './axiosConfig.js';

// Thêm/xóa sản phẩm yêu thích
export const toggleFavorite = async (productId) => {
    try {
        const response = await api.post(`/favorites/${productId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Lấy danh sách sản phẩm yêu thích
export const getFavorites = async (page = 1, limit = 12) => {
    try {
        const response = await api.get(`/favorites?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkFavorite = async (productId) => {
    try {
        const response = await api.get(`/favorites/${productId}/check`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
