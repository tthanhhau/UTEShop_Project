'use client';

import { useState, useEffect } from 'react';
import axios from '../../../../../lib/axios';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Package, CreditCard, MapPin, Calendar, ShoppingBag, Star, Ticket } from 'lucide-react';

export default function CustomerOrderHistory() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchCustomerOrders();
    }
  }, [customerId]);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders for customer:', customerId);
      const response = await axios.get(`/admin/customers/${customerId}/orders`);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        console.log('Customer data:', response.data.data);
        console.log('Orders count:', response.data.data?.orders?.length || 0);
        setCustomerData(response.data.data);
      } else {
        const errMsg = 'Không thể tải dữ liệu khách hàng';
        console.error(errMsg);
        setError(errMsg);
      }
    } catch (error: any) {
      console.error('Error fetching customer orders:', error);
      console.error('Error response:', error.response?.data);
      const errMsg = `Lỗi: ${error.response?.data?.message || error.message}`;
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: any = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'prepared': 'Đã chuẩn bị',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || 'Không xác định';
  };

  const getOrderStatusColor = (status: string) => {
    const colorMap: any = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'processing': 'text-blue-600 bg-blue-100',
      'prepared': 'text-purple-600 bg-purple-100',
      'shipped': 'text-orange-600 bg-orange-100',
      'delivered': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải lịch sử đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy dữ liệu khách hàng'}</p>
          <button
            onClick={() => router.push('/admin/customers')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Quay lại danh sách khách hàng
          </button>
        </div>
      </div>
    );
  }

  const { customer, orders = [] } = customerData || {};

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin khách hàng</p>
          <button
            onClick={() => router.push('/admin/customers')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Quay lại danh sách khách hàng
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
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/admin/customers')}
              className="flex items-center text-gray-600 hover:text-purple-600 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </button>
            <div className="h-6 w-px bg-gray-300 mr-4"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lịch sử đơn hàng - {customer?.name || 'Khách hàng'}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Thông tin khách hàng
              </h3>
              <p className="text-lg font-semibold text-gray-900">{customer?.name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{customer?.email || 'N/A'}</p>
              <p className="text-sm text-gray-600">{customer?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Điểm tích lũy
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {customer?.loyaltyPoints?.balance || 0} điểm
              </p>
              <p className="text-sm text-gray-600">
                Hạng: <span className="font-semibold">{customer?.loyaltyPoints?.tier || 'BRONZE'}</span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Thống kê
              </h3>
              <p className="text-2xl font-bold text-blue-600">{orders?.length || 0} đơn hàng</p>
              <p className="text-sm text-gray-600">
                Tổng chi tiêu: <span className="font-semibold">
                  {formatCurrency((orders || []).reduce((sum: number, order: any) => sum + (order?.totalPrice || 0), 0))}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Vouchers Section */}
        {customer?.voucherClaims && customer.voucherClaims.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-purple-600" />
                Voucher đã sở hữu
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customer.voucherClaims.map((claim: any, index: number) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
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
                      <p>Ngày nhận: {formatDate(claim.lastClaimed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Danh sách đơn hàng ({orders?.length || 0})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <div key={order._id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-600">
                        Đơn hàng #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                      <p className="text-xl font-bold text-gray-900 mt-2">
                        {formatCurrency(order.totalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-700">Sản phẩm:</h4>
                    {order.items.map((item: any) => (
                      <div 
                        key={item._id} 
                        className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex items-center">
                          <img
                            src={item.product?.images?.[0] || '/placeholder.png'}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                            onError={(e: any) => {
                              e.target.src = '/placeholder.png';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product?.name || 'Sản phẩm đã bị xóa'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Số lượng: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-500">
                              Đơn giá: {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-500">Phương thức thanh toán:</span>
                        <span className="ml-2 font-medium">{order.paymentMethod}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500">Trạng thái thanh toán:</span>
                        <span className={`ml-2 font-medium ${
                          order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                      <div className="md:col-span-2 flex items-start">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Địa chỉ giao hàng:</span>
                          <span className="ml-2">{order.shippingAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Khách hàng chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


