'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../../../../lib/axios';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');
  
  useEffect(() => {
    params.then(p => setOrderId(p.id));
  }, [params]);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editData, setEditData] = useState({
    status: '',
    paymentStatus: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/orders/${orderId}`);
      
      const orderData = response.data.order || response.data.data || response.data;
      setOrder(orderData);
      
      setEditData({
        status: orderData.status || '',
        paymentStatus: orderData.paymentStatus || ''
      });
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Backend sẽ tự động update paymentStatus nếu cần (COD + delivered)
      await axios.put(`/admin/orders/${orderId}/status`, {
        status: editData.status
      });

      // Nếu có thay đổi paymentStatus thủ công (không phải auto), vẫn cập nhật
      if (editData.paymentStatus !== order.paymentStatus) {
        await axios.put(`/admin/orders/${orderId}/payment-status`, {
          paymentStatus: editData.paymentStatus
        });
      }

      // Reload trang ngay lập tức để đảm bảo hiển thị đúng trạng thái mới nhất
      // Đặc biệt quan trọng khi chuyển sang "delivered" với COD (backend tự động set paymentStatus = 'paid')
      window.location.reload();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Lỗi cập nhật!');
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-6">{error || 'Không tìm thấy đơn hàng'}</p>
          <button
            onClick={() => router.push('/admin/orders')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex items-center text-gray-600 hover:text-purple-600"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <p className="text-sm text-gray-500">#{order._id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditData({ status: order.status, paymentStatus: order.paymentStatus })}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
          >
            <i className="fas fa-cube mr-2"></i>
            Đang xử lý
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center disabled:opacity-50"
          >
            <i className="fas fa-edit mr-2"></i>
            {saving ? 'Đang lưu...' : 'Chỉnh sửa'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Code & Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <div className="text-lg font-bold text-gray-900">#{order._id?.slice(-8).toUpperCase()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn hàng</label>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                  <i className="fas fa-cube mr-2"></i>
                  Đang xử lý
                </button>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-user text-blue-600 mr-2"></i>
              Khách hàng
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                <div className="text-gray-900">{order.user?.name || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="text-gray-900">{order.user?.phone || order.shippingAddress?.phone || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-gray-900">{order.user?.email || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-map-marker-alt text-red-600 mr-2"></i>
              Địa chỉ giao hàng
            </h3>
            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {order.shippingAddress?.fullAddress || order.shippingAddress || 'N/A'}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-credit-card text-purple-600 mr-2"></i>
              Thanh toán
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức</label>
                <div className="text-gray-900">{order.paymentMethod || 'COD'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm inline-flex items-center">
                  <i className="fas fa-check-circle mr-1"></i>
                  Đã thanh toán
                </span>
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-calendar text-indigo-600 mr-2"></i>
              Thời gian
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt hàng</label>
                <div className="text-gray-900">{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</div>
              </div>
              {order.deliveredAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao hàng</label>
                  <div className="text-gray-900">{formatDate(order.deliveredAt)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Product Details */}
        <div className="space-y-6">
          {/* Products */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {order.items.map((item: any, index: number) => {
                const imageUrl = item.product?.images?.[0] || item.product?.image;
                
                return (
                  <div key={index} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={item.product?.name || 'Product'} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <i className="fas fa-image text-gray-400 text-2xl"></i>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {item.product?.name || 'Sản phẩm không xác định'}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Đơn giá</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(item.price || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Số lượng</span>
                            <span className="font-semibold">x{item.quantity || 0}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-600">Thành tiền</span>
                            <span className="font-bold text-green-600">{formatCurrency((item.price || 0) * (item.quantity || 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Order Total */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium text-gray-700">Tổng tiền đơn hàng:</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(order.totalPrice || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


