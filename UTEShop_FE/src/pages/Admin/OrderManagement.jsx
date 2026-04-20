import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { getOrderDisplayStatus } from '../../utils/orderShippingStatus';

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    confirmedRevenue: 0,
    walletBalance: 0
  });

  // Modal states removed - now using navigation

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        search: filters.search || undefined,
        limit: 50
      };

      const data = await orderApi.getAllOrders(params);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to empty array if API fails
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await orderApi.getOrderStatistics();
      
      setStats({
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        processingOrders: data.processingOrders || 0,
        deliveredOrders: data.deliveredOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        pendingRevenue: data.pendingRevenue || 0,
        confirmedRevenue: data.confirmedRevenue || 0,
        walletBalance: data.walletBalance || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default stats if API fails
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      prepared: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800', 
      prepared: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusText = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      prepared: 'Đã chuẩn bị',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return statusText[status] || 'Không xác định';
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      
      // Cập nhật local state
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus, ...(newStatus === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}) }
          : order
      ));

      // Refresh stats to get updated wallet balance
      await fetchStats();

      alert('Cập nhật trạng thái đơn hàng thành công!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) return false;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const userName = order.user?.name?.toLowerCase() || '';
      const userEmail = order.user?.email?.toLowerCase() || '';
      const orderId = order._id || '';
      const userPhone = order.user?.phone?.toLowerCase() || '';
      
      if (!userName.includes(searchTerm) && 
          !userEmail.includes(searchTerm) && 
          !orderId.includes(searchTerm) && 
          !userPhone.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="text-blue-600 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn chờ xử lý</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-600 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
              <p className="text-3xl font-bold text-cyan-600">{stats.processingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Đã xác nhận</p>
            </div>
            <div className="bg-cyan-100 p-3 rounded-full">
              <Truck className="text-cyan-600 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn giao thành công</p>
              <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Đã hoàn thành</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn đã hủy</p>
              <p className="text-3xl font-bold text-red-600">{stats.cancelledOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Đã bị hủy bỏ</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="text-red-600 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Dòng tiền chi tiết */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê dòng tiền</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Chờ xác nhận</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(stats.pendingRevenue)}</p>
            <p className="text-xs text-orange-500 mt-1">Sẽ vào ví khi giao hàng</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Đã xác nhận</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.confirmedRevenue)}</p>
            <p className="text-xs text-green-500 mt-1">Đã vào ví</p>
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái đơn hàng</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="prepared">Đã chuẩn bị</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái thanh toán</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({...prev, paymentStatus: e.target.value}))}
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input 
              type="text"
              placeholder="Tên khách hàng hoặc mã đơn..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ status: 'all', paymentStatus: 'all', search: '', dateFrom: '', dateTo: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách đơn hàng */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Danh sách đơn hàng ({filteredOrders.length})
          </h3>
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">💡</span>
              Click vào bất kỳ đơn hàng nào để xem chi tiết
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Mã đơn</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Khách hàng</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Tổng tiền</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Trạng thái đơn</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Thanh toán</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Ngày đặt</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className="border-b border-gray-100 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${order._id}`)}
                  title="Click để xem chi tiết đơn hàng"
                >
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-purple-600">
                      #{order._id.slice(-8)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.user?.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(order.totalPrice || 0)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${getOrderDisplayStatus(order).color}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{getOrderDisplayStatus(order).label}</span>
                      </span>
                      {order.shippingInfo?.trackingCode && (
                        <div className="text-xs text-blue-600">
                          {order.shippingInfo.provider}: {order.shippingInfo.trackingCode}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : order.paymentStatus === 'unpaid'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                       order.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Đã hoàn tiền'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{order.paymentMethod}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <select
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 hover:border-purple-500"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          title="Cập nhật trạng thái đơn hàng"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="prepared">Đã chuẩn bị</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Hủy đơn</option>
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal removed - using navigation to OrderDetail page */}
    </div>
  );
};

export default OrderManagement;
