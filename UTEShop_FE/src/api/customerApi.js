import axiosConfig from "./axiosConfig";

const customerApi = {
  // Lấy danh sách tất cả khách hàng (Admin only)
  getAllCustomers: async () => {
    try {
      const response = await axiosConfig.get('/user/admin/customers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy lịch sử đơn hàng chi tiết của khách hàng (Admin only)
  getCustomerOrderHistory: async (customerId) => {
    try {
      const response = await axiosConfig.get(`/user/admin/customers/${customerId}/orders`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default customerApi;
