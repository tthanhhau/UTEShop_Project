import api from './axiosConfig.js';

// Lấy thống kê sản phẩm
export const getProductStats = async (productId) => {
    try {
        const response = await api.get(`/products/${productId}/stats`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
