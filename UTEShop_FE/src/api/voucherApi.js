import axios from './axiosConfig';

const voucherApi = {
  // Admin endpoints
  getAllVouchers: (params = {}) => {
    return axios.get('/admin/vouchers', { params });
  },

  getVoucherById: (id) => {
    return axios.get(`/admin/vouchers/${id}`);
  },

  createVoucher: (data) => {
    return axios.post('/admin/vouchers', data);
  },

  updateVoucher: (id, data) => {
    return axios.put(`/admin/vouchers/${id}`, data);
  },

  deleteVoucher: (id) => {
    return axios.delete(`/admin/vouchers/${id}`);
  },

  getVoucherStats: () => {
    return axios.get('/admin/vouchers/stats');
  },

  // Customer endpoints
  validateVoucher: (data) => {
    return axios.post('/vouchers/validate', data);
  },

  applyVoucher: (data) => {
    return axios.post('/vouchers/apply', data);
  }
};

export default voucherApi;
