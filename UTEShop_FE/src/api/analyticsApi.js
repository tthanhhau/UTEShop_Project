import axios from './axiosConfig';

// API functions cho analytics
export const analyticsApi = {
    // Thống kê tổng hợp cho dashboard
    getDashboardStats: () => {
        return axios.get('/admin/analytics/dashboard');
    },

    // Thống kê tổng quan
    getGeneralStats: (params = {}) => {
        return axios.get('/admin/analytics/general', { params });
    },

    // Thống kê doanh thu
    getRevenue: (params = {}) => {
        return axios.get('/admin/analytics/revenue', { params });
    },

    // Danh sách đơn hàng đã giao thành công
    getCompletedOrders: (params = {}) => {
        return axios.get('/admin/analytics/completed-orders', { params });
    },

    // Thống kê khách hàng mới
    getNewCustomers: (params = {}) => {
        return axios.get('/admin/analytics/new-customers', { params });
    },

    // Top sản phẩm bán chạy
    getTopProducts: (params = {}) => {
        return axios.get('/admin/analytics/top-products', { params });
    }
};

export default analyticsApi;
