import React, { useState, useEffect } from 'react';
import voucherApi from '../../api/voucherApi';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    startDate: '',
    endDate: '',
    maxIssued: '',
    maxUsesPerUser: 1,
    isActive: true,
    rewardType: 'GENERAL'
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    discountType: 'all'
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      
      // Gọi API thật để lấy danh sách voucher
      const response = await voucherApi.getAllVouchers({
        search: filters.search,
        status: filters.status,
        discountType: filters.discountType
      });
      
      console.log('✅ Fetched vouchers from API:', response.data.vouchers);
      setVouchers(response.data.vouchers);
      
    } catch (error) {
      console.error('❌ Error fetching vouchers:', error);
      alert(`Lỗi khi tải voucher: ${error.response?.data?.message || error.message}`);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Loại bỏ isActive khỏi form data vì backend sẽ tự động tính toán
    const { isActive, ...submitData } = formData;
    
    console.log('🔍 Form data being submitted:', submitData);
    console.log('🔍 Editing voucher:', editingVoucher);
    
    try {
      if (editingVoucher) {
        // Gọi API để cập nhật voucher
        console.log('🔄 Updating voucher with ID:', editingVoucher._id);
        const result = await voucherApi.updateVoucher(editingVoucher._id, submitData);
        console.log('✅ Update result:', result);
        alert('Voucher đã được cập nhật thành công!');
      } else {
        // Gọi API để tạo voucher mới
        console.log('➕ Creating new voucher');
        const result = await voucherApi.createVoucher(submitData);
        console.log('✅ Create result:', result);
        alert('Voucher đã được tạo thành công!');
      }
      
      setShowModal(false);
      setEditingVoucher(null);
      resetForm();
      // Fetch lại danh sách sau khi update
      await fetchVouchers();
    } catch (error) {
      console.error('❌ Error saving voucher:', error);
      console.error('❌ Error details:', error.response?.data);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu voucher');
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    
    // Format date để phù hợp với input type="date" (YYYY-MM-DD)
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount || '',
      minOrderAmount: voucher.minOrderAmount || '',
      startDate: formatDate(voucher.startDate),
      endDate: formatDate(voucher.endDate),
      maxIssued: voucher.maxIssued,
      maxUsesPerUser: voucher.maxUsesPerUser,
      isActive: voucher.isActive,
      rewardType: voucher.rewardType || 'GENERAL'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      try {
        // Gọi API để xóa voucher
        await voucherApi.deleteVoucher(id);
        alert('Voucher đã được xóa thành công!');
        // Fetch lại danh sách sau khi xóa
        fetchVouchers();
      } catch (error) {
        console.error('Error deleting voucher:', error);
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa voucher');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      maxDiscountAmount: '',
      minOrderAmount: '',
      startDate: '',
      endDate: '',
      maxIssued: '',
      maxUsesPerUser: 1,
      isActive: true,
      rewardType: 'GENERAL'
    });
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.code.toLowerCase().includes(filters.search.toLowerCase()) ||
                         voucher.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && voucher.isActive) ||
                         (filters.status === 'inactive' && !voucher.isActive);
    const matchesType = filters.discountType === 'all' || voucher.discountType === filters.discountType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getDiscountText = (voucher) => {
    switch (voucher.discountType) {
      case 'PERCENTAGE':
        return `${voucher.discountValue}%`;
      case 'FIXED_AMOUNT':
        return formatCurrency(voucher.discountValue);
      case 'FREE_SHIP':
        return 'Miễn phí ship';
      default:
        return voucher.discountValue;
    }
  };

  const isVoucherValid = (voucher) => {
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = new Date(voucher.endDate);
    
    // Trạng thái chỉ dựa trên thời gian:
    // - Hoạt động: thời gian hiện tại nằm trong khoảng [startDate, endDate]
    // - Hết hạn: thời gian hiện tại không trong khoảng trên
    
    const isDateValid = now >= startDate && now <= endDate;
    
    return isDateValid;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Voucher</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              fetchVouchers();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <i className="fas fa-sync"></i>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingVoucher(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <i className="fas fa-plus"></i>
            <span>Tạo Voucher</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Mã voucher hoặc mô tả..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá</label>
            <select
              value={filters.discountType}
              onChange={(e) => setFilters({ ...filters, discountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tất cả</option>
              <option value="PERCENTAGE">Phần trăm</option>
              <option value="FIXED_AMOUNT">Số tiền cố định</option>
              <option value="FREE_SHIP">Miễn phí ship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã nhận
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-purple-600">{voucher.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{voucher.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getDiscountText(voucher)}
                      </div>
                      {voucher.minOrderAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          Đơn tối thiểu: {formatCurrency(voucher.minOrderAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.claimsCount || 0}/{voucher.maxIssued || voucher.maxUses || '?'}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${((voucher.claimsCount || 0) / (voucher.maxIssued || voucher.maxUses || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.usesCount}/{voucher.maxIssued || voucher.maxUses || 1}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(voucher.usesCount / (voucher.maxIssued || voucher.maxUses || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(voucher.startDate).toLocaleDateString('vi-VN')}</div>
                      <div>{new Date(voucher.endDate).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        voucher.rewardType === 'REVIEW' 
                          ? 'bg-blue-100 text-blue-800'
                          : voucher.rewardType === 'FIRST_ORDER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.rewardType === 'REVIEW' ? 'Đánh giá' :
                         voucher.rewardType === 'FIRST_ORDER' ? 'Đơn đầu' :
                         voucher.rewardType === 'BIRTHDAY' ? 'Sinh nhật' :
                         voucher.rewardType === 'LOYALTY' ? 'Thân thiết' : 'Chung'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isVoucherValid(voucher)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isVoucherValid(voucher) ? 'Hoạt động' : 'Hết hạn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(voucher)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(voucher._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{backgroundColor: 'rgba(128, 128, 128, 0.3)'}}>
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
                  rows="3"
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
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
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
};

export default VoucherManagement;
