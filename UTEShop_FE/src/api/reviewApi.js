import api from './axiosConfig.js';

// Tạo review mới
export const createReview = async (productId, reviewData) => {
    try {
        const response = await api.post(`/reviews/${productId}`, reviewData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Lấy danh sách review của sản phẩm
export const getProductReviews = async (productId, page = 1, limit = 10, rating = null) => {
    try {
        let url = `/reviews/${productId}?page=${page}&limit=${limit}`;
        if (rating) {
            url += `&rating=${rating}`;
        }
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Lấy review của user cho sản phẩm
export const getUserReview = async (productId) => {
    try {
        const response = await api.get(`/reviews/${productId}/user`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Cập nhật review
export const updateReview = async (reviewId, reviewData) => {
    try {
        const response = await api.put(`/reviews/${reviewId}`, reviewData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Xóa review
export const deleteReview = async (reviewId) => {
    try {
        const response = await api.delete(`/reviews/${reviewId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Check if order has been reviewed
export const checkOrderReviewed = async (orderId) => {
    try {
        const response = await api.get(`/reviews/order/${orderId}/check`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Check if a specific product in an order has been reviewed
export const checkProductInOrderReviewed = async (orderId, productId) => {
    try {
        const response = await api.get(`/reviews/order/${orderId}/product/${productId}/check`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Lấy các đánh giá mới nhất cho trang chủ
export const getLatestReviews = async (limit = 6) => {
    try {
        const response = await api.get(`/reviews/latest/home?limit=${limit}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
