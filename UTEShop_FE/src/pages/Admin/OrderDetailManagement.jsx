import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Package,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { orderApi } from '../../api/orderApi';

const OrderDetailManagement = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit state for status updates
  const [editData, setEditData] = useState({
    status: '',
    paymentStatus: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getOrderById(orderId);

      // Backend trả về { order: {...} }, cần extract order
      const orderData = response.order || response;
      setOrder(orderData);

      // Set initial edit data
      setEditData({
        status: orderData.status || '',
        paymentStatus: orderData.paymentStatus || ''
      });
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setError(`Không thể tải thông tin đơn hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      const updates = {};
      if (editData.status !== order.status) {
        updates.status = editData.status;
      }
      if (editData.paymentStatus !== order.paymentStatus) {
        updates.paymentStatus = editData.paymentStatus;
      }

      if (Object.keys(updates).length === 0) {
        alert('Không có thay đổi nào để lưu!');
        return;
      }

      const response = await orderApi.updateOrderStatus(orderId, updates);
      const updatedOrder = response.order || response;

      setOrder(updatedOrder);
      setEditData({
        status: updatedOrder.status || '',
        paymentStatus: updatedOrder.paymentStatus || ''
      });

      // Show success notification
      alert('Cập nhật thành công!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Lỗi cập nhật: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Status options
  const orderStatuses = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' }
    // Note: 'cancelled' is excluded as per user requirement
  ];

  const paymentStatuses = [
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'refunded', label: 'Đã hoàn tiền' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      processing: <Package className="w-5 h-5" />,
      prepared: <Package className="w-5 h-5" />,
      shipped: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Clock className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      prepared: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      prepared: 'Đã chuẩn bị',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return statusTexts[status] || 'Không xác định';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
          <p className="text-sm text-gray-400 mt-2">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-6">{error || 'Không tìm thấy đơn hàng'}</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
                <p className="text-sm text-gray-500">#{order?._id?.slice(-8).toUpperCase() || 'Loading...'}</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">

          {/* Hàng 1 - Sản phẩm đặt hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Sản phẩm đặt hàng ({(order.items || []).length} món)
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {(order.items || []).map((item, index) => {
                // Sử dụng images[0] nếu có (từ backend đã fix populate)
                const imageUrl = item.product?.images?.[0] || item.product?.image;

                return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {/* Product Image - Fixed Logic */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center rounded-lg">
                                <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex flex-col items-center justify-center rounded-lg">
                          <ImageIcon className="w-6 h-6 text-gray-500" />
                          <span className="text-xs text-gray-600 mt-1">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.product?.name || 'Sản phẩm không xác định'}</h3>
                      {item.size && (
                        <p className="text-sm text-blue-600 font-medium mt-1">Size: {typeof item.size === 'object' ? item.size.size || item.size : item.size}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <div className="flex space-x-8">
                          <div>
                            <p className="text-gray-600">Đơn giá</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(item.price || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Số lượng</p>
                            <p className="font-semibold">x{item.quantity || 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600">Thành tiền</p>
                          <p className="font-bold text-green-600 text-lg">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Total */}
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-700">Tổng tiền đơn hàng:</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-600">{formatCurrency(order.totalPrice || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 2 - Thông tin đơn hàng */}
          <div className="space-y-6">
            {/* Thông tin tổng hợp đơn hàng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Thông tin đơn hàng
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Mã đơn hàng & Trạng thái thanh toán */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mã đơn hàng</p>
                    <p className="text-lg font-bold text-gray-900">#{order?._id?.slice(-8).toUpperCase() || 'Loading...'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái thanh toán</label>
                    <select
                      value={editData.paymentStatus}
                      onChange={(e) => setEditData({ ...editData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phương thức thanh toán và Trạng thái đơn hàng */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phương thức thanh toán</p>
                      <p className="text-gray-900 font-semibold">{order.paymentMethod || 'COD'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái đơn hàng</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thông tin khách hàng */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Khách hàng
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tên khách hàng</p>
                      <p className="text-gray-900 font-semibold">{order.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Số điện thoại</p>
                      <p className="text-gray-900">{order.user?.phone || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-gray-900">{order.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ giao hàng & Thời gian */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Địa chỉ giao hàng */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-red-600" />
                        Địa chỉ giao hàng
                      </h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{order.shippingAddress || 'N/A'}</p>
                    </div>

                    {/* Thời gian */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                        Thời gian
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ngày đặt hàng</p>
                          <p className="text-gray-900 font-semibold">{formatDate(order.createdAt)}</p>
                        </div>
                        {order.deliveredAt && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Ngày giao hàng</p>
                            <p className="text-gray-900 font-semibold">{formatDate(order.deliveredAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default OrderDetailManagement;
