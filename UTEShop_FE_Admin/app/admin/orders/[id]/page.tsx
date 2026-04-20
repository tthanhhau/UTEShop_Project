'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../../../../lib/axios';
import { getOrderDisplayStatus } from '../../../../lib/orderShippingStatus';

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
      console.log('🔍 ADMIN ORDER DATA:', orderData);
      console.log('🔍 usedPoints:', orderData.usedPoints);
      console.log('🔍 usedPointsAmount:', orderData.usedPointsAmount);
      console.log('🔍 voucherDiscount:', orderData.voucherDiscount);
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

  const shippingDisplayStatus = getOrderDisplayStatus(order);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/orders')}
          className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
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
                {(() => {
                  const getStatusInfo = (status: string) => {
                    const statusMap: any = {
                      pending: { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: 'fa-clock' },
                      processing: { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: 'fa-spinner' },
                      prepared: { text: 'Đã chuẩn bị', color: 'bg-purple-100 text-purple-800', icon: 'fa-box' },
                      shipped: { text: 'Đang giao', color: 'bg-indigo-100 text-indigo-800', icon: 'fa-truck' },
                      delivered: { text: 'Đã giao', color: 'bg-green-100 text-green-800', icon: 'fa-check-circle' },
                      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: 'fa-times-circle' }
                    };
                    return statusMap[status] || { text: 'Không xác định', color: 'bg-gray-100 text-gray-800', icon: 'fa-question' };
                  };
                  
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <div className="space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center inline-flex ${shippingDisplayStatus.color}`}>
                      <i className={`fas ${statusInfo.icon} mr-2`}></i>
                      {shippingDisplayStatus.label}
                    </span>
                    {order.shippingInfo?.trackingCode && (
                      <div className="text-xs text-blue-600">
                        {order.shippingInfo.provider}: {order.shippingInfo.trackingCode}
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center inline-flex ${statusInfo.color}`}>
                      <i className={`fas ${statusInfo.icon} mr-2`}></i>
                      Nội bộ: {statusInfo.text}
                    </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Customer Info - Gộp tất cả thông tin - Layout gọn */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-info-circle text-blue-600 mr-2"></i>
              Thông tin đơn hàng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái */}
              <div className="space-y-6">
                {/* Thông tin khách hàng */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-user text-blue-600 mr-2"></i>
                    Khách hàng
                  </h4>
                  <div className="space-y-2 pl-6">
                    <div>
                      <label className="text-xs text-gray-500">Tên:</label>
                      <div className="text-sm text-gray-900">{order.customerName || order.user?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">SĐT:</label>
                      <div className="text-sm text-gray-900">{order.customerPhone || order.user?.phone || order.shippingAddress?.phone || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email:</label>
                      <div className="text-sm text-gray-900">{order.user?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Thanh toán */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-credit-card text-purple-600 mr-2"></i>
                    Thanh toán
                  </h4>
                  <div className="space-y-2 pl-6">
                    <div>
                      <label className="text-xs text-gray-500">Phương thức:</label>
                      <div className="text-sm text-gray-900">{order.paymentMethod || 'COD'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Trạng thái:</label>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs inline-flex items-center ${
                          order.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <i className={`fas ${order.paymentStatus === 'paid' ? 'fa-check-circle' : 'fa-clock'} mr-1`}></i>
                          {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-6">
                {/* Địa chỉ giao hàng */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-map-marker-alt text-red-600 mr-2"></i>
                    Địa chỉ giao hàng
                  </h4>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg pl-6">
                    {order.shippingAddress?.fullAddress || order.shippingAddress || 'N/A'}
                  </div>
                </div>

                {/* Thời gian */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-calendar text-indigo-600 mr-2"></i>
                    Thời gian
                  </h4>
                  <div className="space-y-2 pl-6">
                    <div>
                      <label className="text-xs text-gray-500">Ngày đặt:</label>
                      <div className="text-sm text-gray-900">{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</div>
                    </div>
                    {order.deliveredAt && (
                      <div>
                        <label className="text-xs text-gray-500">Ngày giao:</label>
                        <div className="text-sm text-gray-900">{formatDate(order.deliveredAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                          {item.size && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Size</span>
                              <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{item.size}</span>
                            </div>
                          )}
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

          {/* Chi tiết thanh toán */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết thanh toán</h3>
            
            <div className="space-y-3">
              {/* Tạm tính */}
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span className="font-medium">{formatCurrency(
                  (order.totalPrice || 0) + 
                  (order.voucherDiscount || 0) + 
                  (order.usedPointsAmount || 0)
                )}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 my-2"></div>

              {/* Voucher giảm giá */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  Voucher giảm giá
                  {!order.voucherDiscount && (
                    <span className="text-gray-400 text-sm ml-2">(Không áp dụng)</span>
                  )}
                </span>
                {order.voucherDiscount > 0 ? (
                  <span className="font-medium text-green-600">-{formatCurrency(order.voucherDiscount)}</span>
                ) : (
                  <span className="text-gray-400">0 ₫</span>
                )}
              </div>

              {/* Điểm tích lũy */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    Điểm tích lũy
                    {order.usedPoints > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-2">
                        -{order.usedPoints} điểm
                      </span>
                    )}
                  </span>
                  {order.usedPointsAmount > 0 ? (
                    <span className="font-medium text-green-600">-{formatCurrency(order.usedPointsAmount)}</span>
                  ) : (
                    <span className="text-gray-400">0 ₫</span>
                  )}
                </div>
                {order.usedPoints > 0 && order.usedPointsAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Quy đổi: 1 điểm = 100đ (Đã dùng {order.usedPoints} điểm = {formatCurrency(order.usedPointsAmount)})
                  </p>
                )}
              </div>

              {/* Tổng cộng */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                <span className="text-lg font-semibold text-gray-800">Tổng cộng</span>
                <span className="text-2xl font-bold text-purple-600">
                  {formatCurrency(order.totalPrice || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


