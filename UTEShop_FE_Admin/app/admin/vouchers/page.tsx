'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '../../../lib/axios';
import { FaTicketAlt, FaCheckCircle, FaClock, FaPercentage } from 'react-icons/fa';

export default function VouchersManagement() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalVouchers: 0,
    activeVouchers: 0,
    totalUsed: 0,
    totalAvailable: 0
  });
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    maxIssued: '',
    maxUsesPerUser: 1,
    rewardType: 'GENERAL'
  });

  const fetchVouchers = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/vouchers', {
        params: { search, limit: 100 }
      });
      // Backend trả về { success: true, data: [...], pagination: {...} }
      if (response.data.success) {
        const vouchersData = response.data.data || [];
        setVouchers(vouchersData);

        // Calculate stats from vouchers
        const total = vouchersData.length;
        const active = vouchersData.filter((v: any) => v.isActive && new Date(v.endDate) > new Date()).length;
        const used = vouchersData.reduce((sum: number, v: any) => sum + (v.usesCount || 0), 0);
        const available = vouchersData.reduce((sum: number, v: any) => sum + ((v.maxIssued || 0) - (v.usesCount || 0)), 0);

        setStats({
          totalVouchers: total,
          activeVouchers: active,
          totalUsed: used,
          totalAvailable: available
        });
      } else {
        setVouchers([]);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/admin/vouchers/stats');
      if (response.data.success) {
        // If backend provides stats, use them
        // setStats(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVouchers(searchTerm);
      fetchStats();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchVouchers, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        // Check if new maxIssued is less than current usesCount
        if (parseInt(formData.maxIssued) < (editingVoucher.usesCount || 0)) {
          alert('Số lượng phát hành không thể nhỏ hơn số lượng đã sử dụng');
          return;
        }
        await axios.put(`/admin/vouchers/${editingVoucher._id}`, formData);
      } else {
        await axios.post('/admin/vouchers', formData);
      }
      setShowModal(false);
      setEditingVoucher(null);
      resetForm();
      fetchVouchers(searchTerm);
    } catch (error) {
      console.error('Error saving voucher:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa voucher này?')) {
      try {
        await axios.delete(`/admin/vouchers/${id}`);
        fetchVouchers(searchTerm);
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      startDate: '',
      endDate: '',
      maxIssued: '',
      maxUsesPerUser: 1,
      rewardType: 'GENERAL'
    });
  };

  const getVoucherType = (rewardType: string) => {
    const types: Record<string, string> = {
      'GENERAL': 'Chung',
      'REVIEW': 'Dành giá',
      'FIRST_ORDER': 'Chung',
      'BIRTHDAY': 'Sinh nhật',
      'LOYALTY': 'Chung'
    };
    return types[rewardType] || 'Chung';
  };

  const getVoucherStatus = (voucher: any) => {
    const now = new Date();
    const endDate = new Date(voucher.endDate);
    const issued = voucher.issuedCount || 0;
    const maxIssued = voucher.maxIssued || 0;

    if (endDate < now) return 'Hết hạn';
    if (issued >= maxIssued) return 'Hết hạn';
    return 'Hoạt động';
  };

  const formatDiscount = (voucher: any) => {
    if (voucher.discountType === 'FREE_SHIP') {
      return 'Miễn phí ship';
    }
    if (voucher.discountType === 'PERCENTAGE') {
      return `${voucher.discountValue}%`;
    }
    return `${(voucher.discountValue || 0).toLocaleString()} đ`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
        <button
          onClick={() => {
            setEditingVoucher(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <span>+ Thêm Voucher</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <input
          type="text"
          placeholder="Tìm kiếm voucher theo mã hoặc mô tả..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MÃ VOUCHER
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MÔ TẢ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GIẢM GIÁ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ĐÃ NHẬN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SỬ DỤNG
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  THỜI GIAN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LOẠI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRẠNG THÁI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Không có voucher nào
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher: any) => {
                  const issued = voucher.issuedCount || 0;
                  const used = voucher.usesCount || 0;
                  const maxIssued = voucher.maxIssued || 0;
                  const issuedPercent = maxIssued > 0 ? (issued / maxIssued) * 100 : 0;
                  const usedPercent = maxIssued > 0 ? (used / maxIssued) * 100 : 0;
                  const status = getVoucherStatus(voucher);

                  return (
                    <tr key={voucher._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-purple-600">{voucher.code}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">{voucher.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{formatDiscount(voucher)}</div>
                        <div className="text-xs text-gray-500">
                          Đơn tối thiểu: {(voucher.minOrderAmount || 0).toLocaleString()} đ
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {issued}/{maxIssued}
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(issuedPercent, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {used}/{maxIssued}
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(usedPercent, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-900">
                          {new Date(voucher.startDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-900">
                          {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {getVoucherType(voucher.rewardType)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status === 'Hoạt động'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingVoucher(voucher);
                              setFormData({
                                code: voucher.code,
                                description: voucher.description,
                                discountType: voucher.discountType,
                                discountValue: voucher.discountValue,
                                minOrderAmount: voucher.minOrderAmount,
                                maxDiscountAmount: voucher.maxDiscountAmount,
                                startDate: voucher.startDate?.split('T')[0] || '',
                                endDate: voucher.endDate?.split('T')[0] || '',
                                maxIssued: voucher.maxIssued,
                                maxUsesPerUser: voucher.maxUsesPerUser || 1,
                                rewardType: voucher.rewardType
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(voucher._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã Voucher *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại giảm giá *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                    <option value="FREE_SHIP">Miễn phí vận chuyển</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại phần thưởng *
                  </label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="GENERAL">Voucher chung</option>
                    <option value="REVIEW">Phần thưởng đánh giá</option>
                    <option value="FIRST_ORDER">Đơn hàng đầu tiên</option>
                    <option value="BIRTHDAY">Sinh nhật</option>
                    <option value="LOYALTY">Khách hàng thân thiết</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.discountType !== 'FREE_SHIP' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị giảm *
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      required
                    />
                  </div>
                )}

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giảm tối đa (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn hàng tối thiểu (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số voucher phát hành *
                  </label>
                  <input
                    type="number"
                    value={formData.maxIssued}
                    onChange={(e) => setFormData({ ...formData, maxIssued: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới hạn/người dùng
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}









