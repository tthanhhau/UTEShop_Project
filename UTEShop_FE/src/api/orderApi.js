import api from './axiosConfig';

// Admin order management APIs
export const orderApi = {
  // Get all orders with filtering
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  // Get order statistics
  getOrderStatistics: async (params = {}) => {
    const response = await api.get('/orders/admin/statistics', { params });
    return response.data;
  },

  // Get order by ID for current user
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data; // API trả về { success: true, order: {...} }
  },

  // Update order status and payment status
  updateOrderStatus: async (orderId, updateData) => {
    const response = await api.put(`/orders/admin/${orderId}/status`, updateData);
    return response.data;
  },

  // User order APIs
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  }
};

export default orderApi;




