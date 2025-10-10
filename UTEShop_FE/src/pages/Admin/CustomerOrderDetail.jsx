import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import customerApi from '../../api/customerApi';
import { formatPrice } from '../../utils/formatPrice';

const CustomerOrderDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerOrders();
  }, [customerId]);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCustomerOrderHistory(customerId);
      console.log('✅ Fetched customer orders:', response.data);
      setCustomerData(response.data);
    } catch (error) {
      console.error('❌ Error fetching customer orders:', error);
      alert(`Lỗi khi tải lịch sử đơn hàng: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      1: 'Chờ xử lý',
      2: 'Đang xử lý',
      3: 'Đã chuẩn bị',
      4: 'Đang giao',
      5: 'Đã giao',
      6: 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
  };

  const getOrderStatusColor = (status) => {
    const colorMap = {
      1: 'text-yellow-600 bg-yellow-100',
      2: 'text-blue-600 bg-blue-100',
      3: 'text-purple-600 bg-purple-100',
      4: 'text-orange-600 bg-orange-100',
      5: 'text-green-600 bg-green-100',
      6: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không tìm thấy dữ liệu khách hàng</p>
        <button
          onClick={() => navigate('/admin/customers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách khách hàng
        </button>
      </div>
    );
  }

  const { customer, orders, stats } = customerData;

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/customers')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Lịch sử đơn hàng - {customer.name}
          </h1>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Thông tin khách hàng</h3>
            <p className="text-lg font-semibold text-gray-900">{customer.name}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-600">{customer.phone || 'Chưa cập nhật'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Điểm tích lũy</h3>
            <p className="text-lg font-semibold text-green-600">{customer.loyaltyPoints.balance} điểm</p>
            <p className="text-sm text-gray-600">Hạng: {customer.loyaltyPoints.tier}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Thống kê</h3>
            <p className="text-lg font-semibold text-blue-600">{orders.length} đơn hàng</p>
            <p className="text-sm text-gray-600">
              Tổng chi tiêu: {formatPrice(stats.reduce((sum, stat) => sum + stat.totalAmount, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Vouchers list */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Voucher đã sở hữu
          </h2>
        </div>
        <div className="p-6">
          {customer.voucherClaims && customer.voucherClaims.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.voucherClaims.map((claim, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {claim.voucherCode}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      claim.source === 'REVIEW' ? 'bg-blue-100 text-blue-800' :
                      claim.source === 'PROMOTION' ? 'bg-green-100 text-green-800' :
                      claim.source === 'LOYALTY' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {claim.source === 'REVIEW' ? 'Đánh giá' :
                       claim.source === 'PROMOTION' ? 'Khuyến mãi' :
                       claim.source === 'LOYALTY' ? 'Tích lũy' :
                       claim.source}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Số lần nhận: {claim.claimCount}</p>
                    <p>Ngày nhận: {new Date(claim.lastClaimed).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-gray-500">Khách hàng chưa có voucher nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Danh sách đơn hàng ({orders.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Đơn hàng #{order._id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatPrice(order.totalPrice)}
                    </p>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Sản phẩm:</h4>
                  {order.items.map((item) => (
                    <div key={item._id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <img
                          src={item.product?.images?.[0] || '/api/placeholder/60/60'}
                          alt={item.product?.name}
                          className="w-15 h-15 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product?.name || 'Sản phẩm đã bị xóa'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Số lượng: {item.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            Đơn giá: {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Phương thức thanh toán:</span>
                      <span className="ml-2 font-medium">{order.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Trạng thái thanh toán:</span>
                      <span className={`ml-2 font-medium ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Địa chỉ giao hàng:</span>
                      <span className="ml-2">{order.shippingAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Khách hàng chưa có đơn hàng nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;
