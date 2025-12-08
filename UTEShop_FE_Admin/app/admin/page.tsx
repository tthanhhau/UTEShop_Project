'use client';

import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, formatChartCurrency } from '@/lib/utils';
import { FaCoins, FaShoppingCart, FaUsers, FaTshirt, FaTimes } from 'react-icons/fa';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [growth, setGrowth] = useState({
    revenue: '+0%',
    orders: '+0%',
    customers: '+0%',
    products: '+0%',
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear + 1; year >= 2020; year--) {
      years.push(year);
    }
    return years;
  };

  const fetchDashboardData = async (year = selectedYear) => {
    try {
      setLoading(true);
      setError('');

      const [generalResponse, revenueResponse, topProductsResponse] = await Promise.all([
        analyticsApi.getGeneralStats({ year }),
        analyticsApi.getRevenue({ year, type: 'monthly' }),
        analyticsApi.getTopProducts({ limit: 10 }),
      ]);

      if (generalResponse.data.success) {
        setStats(generalResponse.data.data);
        if (generalResponse.data.data.growth) {
          setGrowth(generalResponse.data.data.growth);
        }
      }

      if (revenueResponse.data.success) {
        setRevenueData(revenueResponse.data.data || []);
      }

      if (topProductsResponse.data.success) {
        setTopProducts(topProductsResponse.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 401) {
        setError('Bạn cần đăng nhập để xem dashboard.');
      } else {
        setError('Không thể tải dữ liệu dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedYear);
  }, [selectedYear]);

  const handleViewAllProducts = async () => {
    setShowModal(true);
    setLoadingModal(true);
    try {
      const response = await analyticsApi.getTopProducts({ limit: 100 });
      if (response.data.success) {
        setAllProducts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching all products:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const calculateMaxValue = () => {
    if (revenueData.length === 0) return 100;
    const actualMax = Math.max(...revenueData.map((item: any) => item.value));
    return Math.max(Math.ceil(actualMax / 100) * 100, 100);
  };

  const maxValue = calculateMaxValue();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <div>
            <h3 className="text-red-800 font-semibold">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 mt-1">{growth.revenue}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaCoins className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{growth.orders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaShoppingCart className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Khách hàng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{growth.customers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{growth.products}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FaTshirt className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Doanh thu theo tháng</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {generateYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64 flex">
            <div className="flex flex-col justify-between h-full w-12 mr-4">
              {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map(
                (value, index) => (
                  <div key={index} className="text-xs text-gray-500 text-right">
                    {value}
                  </div>
                )
              )}
              <div className="text-xs text-gray-600 font-medium mt-2 text-center">(triệu ₫)</div>
            </div>
            <div className="flex-1 flex items-end justify-between space-x-2">
              {revenueData.map((item: any, index: number) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t w-full mb-2 transition-all duration-300 hover:from-purple-700 hover:to-purple-500"
                    style={{ height: `${(item.value / maxValue) * 200}px` }}
                    title={formatChartCurrency(item.value)}
                  ></div>
                  <span className="text-xs text-gray-600">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top 10 sản phẩm bán chạy</h3>
            <button
              onClick={handleViewAllProducts}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Xem tất cả
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {topProducts.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 bg-gradient-to-r ${product.color} rounded-lg flex items-center justify-center`}>
                      <FaTshirt className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0 max-w-[180px] sm:max-w-[250px] md:max-w-[300px]">
                    <p className="font-medium text-gray-800 truncate text-sm" title={product.name}>
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600">{product.soldCount || 0} đã bán</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-32">
                  <span className="text-blue-600 font-semibold text-sm block">
                    {formatCurrency(product.price || product.discountedPrice || product.originalPrice || 0)}
                  </span>
                  <span className="text-green-600 font-semibold text-xs">
                    Doanh thu: {formatCurrency(product.revenue || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal hiển thị tất cả sản phẩm bán chạy */}
        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tất cả sản phẩm bán chạy</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {allProducts.length} sản phẩm được xếp hạng theo số lượng bán
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {loadingModal ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {allProducts.map((product: any, index: number) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-12">
                            <span className="text-2xl font-bold text-purple-600">
                              #{index + 1}
                            </span>
                          </div>
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className={`w-16 h-16 bg-gradient-to-r ${product.color} rounded-lg flex items-center justify-center shadow-sm`}>
                              <FaTshirt className="text-white text-xl" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                            <p className="font-semibold text-gray-800 truncate text-sm" title={product.name}>
                              {product.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-sm text-gray-600">
                                {product.soldCount || 0} đã bán
                              </span>
                              {product.discountPercentage > 0 && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                  -{product.discountPercentage}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {product.category} • {product.brand}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 w-40">
                          <div className="flex items-center gap-2 justify-end">
                            {product.discountPercentage > 0 && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(product.originalPrice || 0)}
                              </span>
                            )}
                            <span className="text-lg font-bold text-purple-600">
                              {formatCurrency(product.price || product.discountedPrice || product.originalPrice || 0)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="text-sm text-green-600 font-semibold">
                              DOANH THU: {formatCurrency(product.revenue || 0)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Còn: {product.stock || 0} sp
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






