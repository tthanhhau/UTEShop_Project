import api from './axiosConfig.js';

// Lấy sản phẩm tương tự
export const getSimilarProducts = async (productId, limit = 8) => {
    try {
        const response = await api.get(`/similar-products/${productId}?limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
