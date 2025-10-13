'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '../../../lib/axios';
import { useRouter } from 'next/navigation';
import { FaUsers, FaUserCheck, FaStar, FaShoppingBag } from 'react-icons/fa';

export default function CustomersManagement() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tier: 'all'
  });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0,
    totalPoints: 0
  });

  const fetchCustomers = useCallback(async (search = '') => {
    try {
      if (isFirstLoad) {
        setLoading(true);
      }
      const response = await axios.get('/admin/customers', {
        params: { search, limit: 50 }
      });
      // Backend trả về { success: true, data: [...], pagination: {...} }
      if (response.data.success) {
        setCustomers(response.data.data || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [isFirstLoad]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/admin/customers/stats');
      if (response.data.success) {
        setStats(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchCustomers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierText = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'Vàng';
      case 'SILVER': return 'Bạc';
      case 'BRONZE': return 'Đồng';
      default: return tier;
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer: any) => {
    const matchesTier = filters.tier === 'all' || customer.loyaltyPoints?.tier === filters.tier;
    return matchesTier;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
        <div className="text-sm text-gray-600">
          Tổng cộng: {filteredCustomers.length} khách hàng
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Khách hàng</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</p>
              <p className="text-sm text-green-600 mt-1">+100.0%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaUsers className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Khách hàng hoạt động</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeCustomers}</p>
              <p className="text-sm text-green-600 mt-1">Active</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaUserCheck className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{customers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0)}</p>
              <p className="text-sm text-blue-600 mt-1">Orders</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaShoppingBag className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Tổng điểm tích lũy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {customers.reduce((sum: number, c: any) => {
                  const points = typeof c.loyaltyPoints === 'object' ? c.loyaltyPoints?.balance || 0 : c.loyaltyPoints || 0;
                  return sum + points;
                }, 0)}
              </p>
              <p className="text-sm text-orange-600 mt-1">Points</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FaStar className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạng thành viên
            </label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="BRONZE">Đồng</option>
              <option value="SILVER">Bạc</option>
              <option value="GOLD">Vàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm tích lũy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer: any) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/customers/${customer._id}/orders`)}
                    title="Click để xem chi tiết đơn hàng"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadgeClass(customer.loyaltyPoints?.tier || 'BRONZE')}`}>
                              {getTierText(customer.loyaltyPoints?.tier || 'BRONZE')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone || 'Chưa cập nhật'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Hiện có: <span className="font-medium text-green-600">{customer.loyaltyPoints?.balance || 0}</span></div>
                        <div>Đã nhận: <span className="text-blue-600">0</span></div>
                        <div>Đã dùng: <span className="text-red-600">0</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.voucherClaims?.length || 0} voucher
                      </div>
                      {customer.voucherClaims && customer.voucherClaims.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {customer.voucherClaims.slice(0, 2).map((claim: any) => claim.voucherCode).join(', ')}
                          {customer.voucherClaims.length > 2 && '...'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{customer.totalOrders || 0} đơn hàng</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(customer.totalSpent || 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/customers/${customer._id}/orders`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem đơn hàng
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}









