'use client';

import { useState, useEffect } from 'react';
import axios from '../../../lib/axios';

export default function PointsManagement() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    activeMembers: 0,
    membersByTier: { BRONZE: 0, SILVER: 0, GOLD: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsForm, setPointsForm] = useState({
    userId: '',
    type: 'ADJUSTMENT',
    points: '',
    description: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    tier: 'all',
    transactionType: 'all'
  });

  const [pointsConfig, setPointsConfig] = useState({
    pointsPerOrder: 1,
    pointsValue: 1000,
    bronzeThreshold: 0,
    silverThreshold: 1000,
    goldThreshold: 5000
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchTransactions();
    fetchStats();
    loadPointsConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else {
      fetchTransactions();
    }
  }, [filters.search, filters.tier, filters.transactionType, activeTab]);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/customers', {
        params: {
          page,
          limit: 10,
          search: filters.search,
          tier: filters.tier === 'all' ? undefined : filters.tier
        }
      });
      
      if (response.data.success) {
        setCustomers(response.data.data || []);
        setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const response = await axios.get('/admin/points', {
        params: {
          page,
          limit: 10,
          search: filters.search,
          type: filters.transactionType === 'all' ? undefined : filters.transactionType
        }
      });
      
      if (response.data.success) {
        setTransactions(response.data.data || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/points/stats');
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setStats({
          totalPointsIssued: data.totalPointsEarned || 0,
          totalPointsRedeemed: data.totalPointsRedeemed || 0,
          activeMembers: data.totalTransactions || 0,
          membersByTier: data.membersByTier || { BRONZE: 0, SILVER: 0, GOLD: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadPointsConfig = async () => {
    try {
      // TODO: Implement API endpoint for config
      setPointsConfig({
        pointsPerOrder: 1,
        pointsValue: 1000,
        bronzeThreshold: 0,
        silverThreshold: 1000,
        goldThreshold: 5000
      });
    } catch (error) {
      console.error('Error loading points config:', error);
    }
  };

  const savePointsConfig = async () => {
    try {
      // TODO: Implement API endpoint for updating config
      alert('Cấu hình đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving points config:', error);
      alert('Có lỗi xảy ra khi lưu cấu hình!');
    }
  };

  const handlePointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement API endpoint for adjustment
      alert('Điều chỉnh điểm thành công!');
      setShowModal(false);
      setPointsForm({
        userId: '',
        type: 'ADJUSTMENT',
        points: '',
        description: ''
      });
      
      fetchCustomers();
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Có lỗi xảy ra khi điều chỉnh điểm!');
    }
  };

  const openPointsModal = (customer: any = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setPointsForm({
        userId: customer._id,
        type: 'ADJUSTMENT',
        points: '',
        description: ''
      });
    } else {
      setSelectedCustomer(null);
      setPointsForm({
        userId: '',
        type: 'ADJUSTMENT',
        points: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'fas fa-medal text-orange-600';
      case 'SILVER': return 'fas fa-medal text-gray-600';
      case 'GOLD': return 'fas fa-crown text-yellow-600';
      default: return 'fas fa-user text-gray-600';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'EARNED': return 'bg-green-100 text-green-800';
      case 'REDEEMED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'EARNED': return 'Tích điểm';
      case 'REDEEMED': return 'Đổi điểm';
      case 'EXPIRED': return 'Hết hạn';
      case 'ADJUSTMENT': return 'Điều chỉnh';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculatePointsFromAmount = (amount: number) => {
    return Math.floor(amount / pointsConfig.pointsValue);
  };

  const calculateAmountFromPoints = (points: number) => {
    return points * pointsConfig.pointsValue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Điểm tích lũy</h1>
        <button
          onClick={() => openPointsModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <i className="fas fa-plus"></i>
          <span>Điều chỉnh điểm</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <i className="fas fa-star text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng điểm đã phát</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPointsIssued?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <i className="fas fa-gift text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Điểm đã đổi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPointsRedeemed?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <i className="fas fa-medal text-orange-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Thành viên hạng đồng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.membersByTier?.BRONZE?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <i className="fas fa-medal text-gray-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Thành viên hạng bạc</p>
              <p className="text-2xl font-bold text-gray-900">{stats.membersByTier?.SILVER?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <i className="fas fa-crown text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Thành viên hạng vàng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.membersByTier?.GOLD?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cấu hình điểm tích lũy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỉ lệ tích điểm
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={pointsConfig.pointsValue}
                onChange={(e) => setPointsConfig({ ...pointsConfig, pointsValue: Number(e.target.value) })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">VND = 1 điểm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hạng Bạc (điểm)
            </label>
            <input
              type="number"
              value={pointsConfig.silverThreshold}
              onChange={(e) => setPointsConfig({ ...pointsConfig, silverThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hạng Vàng (điểm)
            </label>
            <input
              type="number"
              value={pointsConfig.goldThreshold}
              onChange={(e) => setPointsConfig({ ...pointsConfig, goldThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button 
          onClick={savePointsConfig}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Lưu cấu hình
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Khách hàng ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lịch sử giao dịch ({transactions.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder={activeTab === 'customers' ? 'Tên hoặc email...' : 'Tên khách hàng hoặc mô tả...'}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {activeTab === 'customers' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hạng thành viên</label>
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="BRONZE">Đồng</option>
                  <option value="SILVER">Bạc</option>
                  <option value="GOLD">Vàng</option>
                </select>
              </div>
            )}
            {activeTab === 'transactions' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="EARNED">Tích điểm</option>
                  <option value="REDEEMED">Đổi điểm</option>
                  <option value="EXPIRED">Hết hạn</option>
                  <option value="ADJUSTMENT">Điều chỉnh</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'customers' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Hạng</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Điểm hiện tại</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: any) => (
                    <tr key={customer._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(customer.loyaltyPoints?.tier || 'BRONZE')}`}>
                          <i className={`${getTierIcon(customer.loyaltyPoints?.tier || 'BRONZE')} mr-1`}></i>
                          {customer.loyaltyPoints?.tier || 'BRONZE'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-purple-600">
                          {(customer.loyaltyPoints?.balance || 0).toLocaleString()} điểm
                        </div>
                        <div className="text-xs text-gray-500">
                          ≈ {formatCurrency(calculateAmountFromPoints(customer.loyaltyPoints?.balance || 0))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => openPointsModal(customer)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Khách hàng</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Loại</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Điểm</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Mô tả</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: any) => (
                    <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{transaction.user?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{transaction.user?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeText(transaction.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`font-bold ${transaction.type === 'REDEEMED' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'REDEEMED' ? '-' : '+'}{transaction.points.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{transaction.description}</div>
                        {transaction.order && (
                          <div className="text-xs text-gray-500">Đơn hàng: {transaction.order}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Points Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{backgroundColor: 'rgba(128, 128, 128, 0.3)'}}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Điều chỉnh điểm</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handlePointsAdjustment} className="space-y-4">
              {!selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn khách hàng *
                  </label>
                  <select
                    value={pointsForm.userId}
                    onChange={(e) => setPointsForm({ ...pointsForm, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((customer: any) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCustomer && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-600">{selectedCustomer.email}</div>
                  <div className="text-sm text-purple-600 font-medium">
                    Điểm hiện tại: {(selectedCustomer.loyaltyPoints?.balance || 0).toLocaleString()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại giao dịch *
                </label>
                <select
                  value={pointsForm.type}
                  onChange={(e) => setPointsForm({ ...pointsForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="ADJUSTMENT">Điều chỉnh</option>
                  <option value="EARNED">Thưởng điểm</option>
                  <option value="REDEEMED">Trừ điểm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điểm *
                </label>
                <input
                  type="number"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ {formatCurrency(calculateAmountFromPoints(Number(pointsForm.points) || 0))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả *
                </label>
                <textarea
                  value={pointsForm.description}
                  onChange={(e) => setPointsForm({ ...pointsForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  required
                />
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
                  Thực hiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




