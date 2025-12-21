import axios from './axios';

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    axios.post('/auth/admin/login', credentials),
  getProfile: () => axios.get('/auth/me'),
  forgotPassword: (data: { email: string }) =>
    axios.post('/auth/admin/forgot-password', data),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    axios.post('/auth/admin/reset-password', data),
};

// Analytics API
export const analyticsApi = {
  getGeneralStats: (params?: { year?: number }) =>
    axios.get('/admin/analytics/general-stats', { params }),
  getRevenue: (params?: { year?: number; type?: string }) =>
    axios.get('/admin/analytics/revenue', { params }),
  getTopProducts: (params?: { limit?: number }) =>
    axios.get('/admin/analytics/top-products', { params }),
  getCompletedOrders: (params?: { page?: number; limit?: number }) =>
    axios.get('/admin/analytics/completed-orders', { params }),
};

// Brand API
export const brandApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axios.get('/admin/brands', { params }),
  getById: (id: string) => axios.get(`/admin/brands/${id}`),
  create: (data: any) => axios.post('/admin/brands', data),
  update: (id: string, data: any) => axios.put(`/admin/brands/${id}`, data),
  delete: (id: string) => axios.delete(`/admin/brands/${id}`),
  deleteMultiple: (ids: string[]) => axios.delete('/admin/brands/multiple/delete', { data: { ids } }),
};

// Category API
export const categoryApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axios.get('/admin/categories', { params }),
  getById: (id: string) => axios.get(`/admin/categories/${id}`),
  create: (data: any) => axios.post('/admin/categories', data),
  update: (id: string, data: any) => axios.put(`/admin/categories/${id}`, data),
  delete: (id: string) => axios.delete(`/admin/categories/${id}`),
  deleteMultiple: (ids: string[]) => axios.delete('/admin/categories/multiple/delete', { data: { ids } }),
};

// Product API
export const productApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axios.get('/admin/products', { params }),
  getById: (id: string) => axios.get(`/admin/products/${id}`),
  create: (data: any) => axios.post('/admin/products', data),
  update: (id: string, data: any) => axios.put(`/admin/products/${id}`, data),
  delete: (id: string) => axios.delete(`/admin/products/${id}`),
  deleteMultiple: (ids: string[]) => axios.delete('/admin/products/multiple/delete', { data: { ids } }),
};

// Order API
export const orderApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }) =>
    axios.get('/admin/orders', { params }),
  getById: (id: string) => axios.get(`/admin/orders/${id}`),
  getStats: () => axios.get('/admin/orders/stats'),
  updateStatus: (id: string, status: string) =>
    axios.put(`/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    axios.put(`/admin/orders/${id}/payment-status`, { paymentStatus }),
};

// Customer API
export const customerApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axios.get('/admin/customers', { params }),
  getById: (id: string) => axios.get(`/admin/customers/${id}`),
  getStats: () => axios.get('/admin/customers/stats'),
  updateStatus: (id: string, isActive: boolean) =>
    axios.put(`/admin/customers/${id}/status`, { isActive }),
  getCustomerOrderHistory: (id: string) => axios.get(`/admin/customers/${id}/orders`),
};

// Voucher API
export const voucherApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    axios.get('/admin/vouchers', { params }),
  getById: (id: string) => axios.get(`/admin/vouchers/${id}`),
  getStats: () => axios.get('/admin/vouchers/stats'),
  create: (data: any) => axios.post('/admin/vouchers', data),
  update: (id: string, data: any) => axios.put(`/admin/vouchers/${id}`, data),
  delete: (id: string) => axios.delete(`/admin/vouchers/${id}`),
};

// Points API
export const pointsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) =>
    axios.get('/admin/points', { params }),
  getStats: () => axios.get('/admin/points/stats'),
  getUserPoints: (userId: string) => axios.get(`/admin/points/user/${userId}`),
};

// Review API
export const reviewApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; rating?: number; productId?: string }) =>
    axios.get('/admin/reviews', { params }),
  getById: (id: string) => axios.get(`/admin/reviews/${id}`),
  getStats: () => axios.get('/admin/reviews/stats'),
  reply: (id: string, comment: string) => axios.post(`/admin/reviews/${id}/reply`, { comment }),
  delete: (id: string) => axios.delete(`/admin/reviews/${id}`),
};

// Return API
export const returnApi = {
  getAll: (params?: { status?: string }) =>
    axios.get('/returns', { params }),
  getById: (id: string) => axios.get(`/returns/${id}`),
  getStats: () => axios.get('/returns/stats'),
  approve: (id: string, adminNote?: string) =>
    axios.post(`/returns/${id}/approve`, { adminNote }),
  reject: (id: string, adminNote: string) =>
    axios.post(`/returns/${id}/reject`, { adminNote }),
};

export default {
  auth: authApi,
  analytics: analyticsApi,
  brand: brandApi,
  category: categoryApi,
  product: productApi,
  order: orderApi,
  customer: customerApi,
  voucher: voucherApi,
  points: pointsApi,
  review: reviewApi,
  return: returnApi,
};
