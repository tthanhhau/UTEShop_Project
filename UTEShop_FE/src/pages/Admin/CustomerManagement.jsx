import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import customerApi from '../../api/customerApi';
import { formatPrice } from '../../utils/formatPrice';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    tier: 'all'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getAllCustomers();
      console.log('✅ Fetched customers from API:', response.data);
      setCustomers(response.data);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      alert(`Lỗi khi tải danh sách khách hàng: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (customer) => {
    navigate(`/admin/customers/${customer._id}/orders`);
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(filters.search));
    
    const matchesTier = filters.tier === 'all' || customer.loyaltyPoints.tier === filters.tier;
    
    return matchesSearch && matchesTier;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
        <div className="text-sm text-gray-600">
          Tổng cộng: {filteredCustomers.length} khách hàng
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
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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

      {/* Customer List */}
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(customer)}
                  title="Click để xem chi tiết đơn hàng"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={customer.avatarUrl || '/api/placeholder/40/40'}
                          alt={customer.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.loyaltyPoints.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                            customer.loyaltyPoints.tier === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {customer.loyaltyPoints.tier === 'GOLD' ? 'Vàng' :
                             customer.loyaltyPoints.tier === 'SILVER' ? 'Bạc' : 'Đồng'}
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
                      <div>Hiện có: <span className="font-medium text-green-600">{customer.loyaltyPoints.balance}</span></div>
                      <div>Đã nhận: <span className="text-blue-600">{customer.earnedPoints}</span></div>
                      <div>Đã dùng: <span className="text-red-600">{customer.usedPoints}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.vouchers.length} voucher
                    </div>
                    {customer.vouchers.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {customer.vouchers.slice(0, 2).map(voucher => voucher.code).join(', ')}
                        {customer.vouchers.length > 2 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{customer.totalOrders} đơn hàng</div>
                      <div className="font-medium text-green-600">
                        {formatPrice(customer.totalSpent)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;




