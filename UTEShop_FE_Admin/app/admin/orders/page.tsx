'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../../../lib/axios';

export default function OrderManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalOrders: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    paymentMethod: 'all',
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
    confirmedRevenue: 0
  });

  const fetchOrders = useCallback(async (search = '', status = 'all', paymentStatus = 'all', paymentMethod = 'all', page = 1, pageSize = 10) => {
    try {
      if (isFirstLoad) {
        setLoading(true);
      }
      const params: any = {
        status: status !== 'all' ? status : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
        search: search || undefined,
        page: page,
        limit: pageSize
      };

      const response = await axios.get('/admin/orders', { params });

      if (response.data.success) {
        const ordersData = response.data.data || [];
        const paginationData = response.data.pagination || {};
        
        setOrders(ordersData);
        
        // Cập nhật pagination từ backend
        setPagination({
          currentPage: paginationData.currentPage || page,
          pageSize: paginationData.itemsPerPage || pageSize,
          totalPages: paginationData.totalPages || 1,
          totalOrders: paginationData.totalItems || ordersData.length || 0
        });
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      if (isFirstLoad) {
        setLoading(false);
        setIsFirstLoad(false);
      }
    }
  }, [isFirstLoad]);

  // Debounce cho search và pagination
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(
        filters.search, 
        filters.status, 
        filters.paymentStatus, 
        filters.paymentMethod,
        pagination.currentPage,
        pagination.pageSize
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.paymentStatus, filters.paymentMethod, pagination.currentPage, pagination.pageSize, fetchOrders]);

  // Fetch stats khi filters thay đổi
  useEffect(() => {
    fetchStats();
  }, [filters.status, filters.paymentStatus]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/orders/stats');

      if (response.data.success) {
        const data = response.data.data;
        setStats({
          totalOrders: data.totalOrders || 0,
          pendingOrders: data.pendingOrders || 0,
          processingOrders: data.processingOrders || 0,
          deliveredOrders: data.deliveredOrders || 0,
          cancelledOrders: data.cancelledOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingRevenue: data.pendingRevenue || 0,
          confirmedRevenue: data.confirmedRevenue || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Tìm order hiện tại để kiểm tra paymentMethod
      const currentOrder = orders.find((o: any) => o._id === orderId);
      const isCOD = currentOrder?.paymentMethod === 'COD';
      
      await axios.put(`/admin/orders/${orderId}/status`, { status: newStatus });

      // Nếu chuyển sang "delivered" với COD, backend sẽ tự động set paymentStatus = 'paid'
      // Reload trang để đảm bảo hiển thị đúng trạng thái mới nhất
      if (newStatus === 'delivered' && isCOD) {
        window.location.reload();
        return;
      }

      // Các trường hợp khác: fetch lại data từ server
      await fetchOrders(filters.search, filters.status, filters.paymentStatus, filters.paymentMethod, pagination.currentPage, pagination.pageSize);
      await fetchStats();
      alert('Cập nhật trạng thái đơn hàng thành công!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      prepared: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusText: any = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      prepared: 'Đã chuẩn bị',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return statusText[status] || 'Không xác định';
  };

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
              <i className="fas fa-box text-blue-600 text-xl"></i>
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
              <i className="fas fa-clock text-yellow-600 text-xl"></i>
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
              <i className="fas fa-truck text-cyan-600 text-xl"></i>
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
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
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
              <i className="fas fa-times-circle text-red-600 text-xl"></i>
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
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto md:flex-1 md:max-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái đơn hàng</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }));
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
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

          <div className="w-full md:w-auto md:flex-1 md:max-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái thanh toán</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.paymentStatus}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, paymentStatus: e.target.value }));
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="all">Tất cả</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          <div className="w-full md:w-auto md:flex-1 md:max-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.paymentMethod}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, paymentMethod: e.target.value }));
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="all">Tất cả</option>
              <option value="COD">COD</option>
              <option value="MoMo">MoMo</option>
            </select>
          </div>

          <div className="w-full md:flex-1 md:min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên khách hàng hoặc mã đơn..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2 invisible">Đặt lại</label>
            <button
              onClick={() => {
                setFilters({ status: 'all', paymentStatus: 'all', paymentMethod: 'all', search: '', dateFrom: '', dateTo: '' });
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="w-full md:w-auto bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách đơn hàng */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Danh sách đơn hàng ({pagination.totalOrders})
          </h3>
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
              {orders.map((order: any) => (
                <tr
                  key={order._id}
                  className="border-b border-gray-100 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${order._id}`)}
                  title="Click để xem chi tiết đơn hàng"
                >
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-purple-600">
                      #{order._id.slice(-8).toUpperCase()}
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      <i className={`fas ${order.status === 'pending' ? 'fa-clock' :
                          order.status === 'processing' ? 'fa-box' :
                            order.status === 'shipped' ? 'fa-truck' :
                              order.status === 'delivered' ? 'fa-check-circle' :
                                'fa-times-circle'
                        } mr-2`}></i>
                      <span>{getStatusText(order.status)}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs ${order.paymentStatus === 'paid'
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/orders/${order._id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {/* Nút chuyển trạng thái tuần tự */}
                      {(() => {
                        // Ánh xạ trạng thái tiếp theo
                        const statusFlow: any = {
                          processing: "prepared",
                          prepared: "shipped",
                          shipped: "delivered"
                        };
                        const nextStatus = statusFlow[order.status];
                        // Chỉ hiện với các trạng thái trong flow, không hiện khi đã delivered hoặc cancelled hoặc pending
                        if (nextStatus && order.status !== 'delivered' && order.status !== 'cancelled') {
                          return (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await updateOrderStatus(order._id, nextStatus);
                              }}
                              className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors text-xs"
                              title="Chuyển trạng thái tiếp theo"
                            >
                              Chuyển trạng thái
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={pagination.pageSize}
                onChange={(e) => {
                  setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), currentPage: 1 }));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">
                / {pagination.totalOrders} đơn hàng
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                      className={`px-3 py-1 border border-gray-300 rounded text-sm ${
                        pagination.currentPage === pageNum
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
