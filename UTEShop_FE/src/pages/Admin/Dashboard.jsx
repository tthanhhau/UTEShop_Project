import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/analyticsApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0
  });

  const [growth, setGrowth] = useState({
    revenue: '+0%',
    orders: '+0%',
    customers: '+0%',
    products: '+0%'
  });

  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [completedOrdersStats, setCompletedOrdersStats] = useState({
    totalCompleted: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, month: '', value: 0 });
  const [showAllProductsModal, setShowAllProductsModal] = useState(false);
  const [allTopProducts, setAllTopProducts] = useState([]);

  // Generate years from 2003 to current year + 1
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 2003; year--) {
      years.push(year);
    }
    return years;
  };

  const availableYears = generateYears();

  // Fetch dashboard data for specific year
  const fetchDashboardData = async (year = selectedYear) => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Check if token exists
      const token = sessionStorage.getItem('token');
      console.log('🔍 Dashboard - Token exists:', !!token);
      if (token) {
        console.log('🔍 Dashboard - Token preview:', token.substring(0, 20) + '...');
      }

      console.log(`🗓️ Fetching data for year: ${year}`);

      // Fetch general stats with year parameter
      const generalResponse = await analyticsApi.getGeneralStats({ year });

      if (generalResponse.data.success) {
        const data = generalResponse.data.data;

        // Update stats for the selected year
        setStats({
          totalRevenue: data.totalRevenue,
          totalOrders: data.totalOrders,
          totalCustomers: data.totalCustomers,
          totalProducts: data.totalProducts
        });

        // Set growth data
        if (data.growth) {
          setGrowth(data.growth);
        }
      }

      // Fetch other data
      const [revenueResponse, topProductsResponse] = await Promise.all([
        analyticsApi.getRevenue({ year, type: 'monthly' }),
        analyticsApi.getTopProducts({ limit: 10 })
      ]);

      if (revenueResponse.data.success) {
        setRevenueData(revenueResponse.data.data || []);
      }

      if (topProductsResponse.data.success) {
        const topProductsData = topProductsResponse.data.data || [];
        console.log('🔍 DEBUG - Frontend received top products:', topProductsData.slice(0, 5).map(p => ({
          name: p.name,
          sold: p.sold,
          soldCount: p.soldCount,
          revenue: p.revenue
        })));
        setTopProducts(topProductsData);
      }

      // Fetch recent completed orders for stats
      const completedOrdersResponse = await analyticsApi.getCompletedOrders({ page: 1, limit: 5 });
      if (completedOrdersResponse.data.success) {
        setRecentOrders(completedOrdersResponse.data.data || []);

        // Set completed orders stats from general stats
        setCompletedOrdersStats({
          totalCompleted: generalResponse.data.data.totalOrders || 0, // This is orders for the year
          totalRevenue: generalResponse.data.data.totalRevenue || 0   // This is revenue for the year
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Bạn cần đăng nhập với tài khoản admin để xem dashboard. Vui lòng đăng nhập lại.');
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.');
      } else {
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };


  // Fetch completed orders for detailed view
  const fetchCompletedOrders = async () => {
    try {
      const response = await analyticsApi.getCompletedOrders({ page: 1, limit: 20 });
      if (response.data.success) {
        // Open modal hoặc navigate to dedicated page
        console.log('Completed orders:', response.data.data);
        alert(`Tìm thấy ${response.data.pagination.totalItems} đơn hàng đã giao thành công!`);
      }
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      alert('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    }
  };

  // Fetch all top products for modal
  const fetchAllTopProducts = async () => {
    try {
      setShowAllProductsModal(true);
      const response = await analyticsApi.getTopProducts({ limit: 50 }); // Get top 50 products
      if (response.data.success) {
        // API đã sắp xếp theo soldCount rồi, không cần sắp xếp lại
        const topProductsData = response.data.data || [];
        console.log('🔍 DEBUG - Modal received top products:', topProductsData.slice(0, 5).map(p => ({
          name: p.name,
          soldCount: p.soldCount,
          sold: p.sold
        })));
        setAllTopProducts(topProductsData);
      }
    } catch (err) {
      console.error('Error fetching all top products:', err);
      alert('Không thể tải danh sách sản phẩm bán chạy. Vui lòng thử lại.');
    }
  };

  // Navigate to product management
  const handleProductCardClick = () => {
    navigate('/admin/products');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Fetch all dashboard data when year changes
    console.log(`📊 Year changed to: ${selectedYear}`);
    fetchDashboardData(selectedYear);
  }, [selectedYear]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  // Format currency for chart (already in millions)
  const formatChartCurrency = (amount) => {
    if (amount === 0) return '0 triệu ₫';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' triệu ₫';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipping': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'processing': return 'Đang xử lý';
      case 'shipping': return 'Đang giao';
      default: return 'Không xác định';
    }
  };

  // Calculate max value and round to nice numbers
  const calculateNiceMaxValue = () => {
    if (revenueData.length === 0) return 100;

    const actualMax = Math.max(...revenueData.map(item => item.value));

    // Round up to next hundred
    const roundedMax = Math.ceil(actualMax / 100) * 100;

    // Ensure minimum is 100
    return Math.max(roundedMax, 100);
  };

  const maxValue = calculateNiceMaxValue();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-3"></i>
            <div>
              <h3 className="text-red-800 font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <i className="fas fa-coins text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Khách hàng</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <i className="fas fa-users text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={handleProductCardClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <i className="fas fa-tshirt text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Doanh thu theo tháng</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="h-64 flex relative">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-full w-12 mr-4">
              {(() => {
                // Generate 5 nice rounded values for Y-axis (0, 25%, 50%, 75%, 100%)
                const yAxisValues = [
                  maxValue,
                  Math.round(maxValue * 0.75 / 100) * 100,
                  Math.round(maxValue * 0.5 / 100) * 100,
                  Math.round(maxValue * 0.25 / 100) * 100,
                  0
                ];
                return yAxisValues.map((value, index) => (
                  <div key={index} className="text-xs text-gray-500 text-right">
                    {value}
                  </div>
                ));
              })()}
              <div className="text-xs text-gray-600 font-medium mt-2 text-center">
                (triệu ₫)
              </div>
            </div>

            {/* Chart bars */}
            <div className="flex-1 flex items-end justify-between space-x-2">
              {revenueData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      show: true,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                      month: item.month,
                      value: item.value
                    });
                  }}
                  onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, month: '', value: 0 })}
                >
                  <div
                    className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t w-full mb-2 transition-all duration-300 hover:from-purple-700 hover:to-purple-500"
                    style={{ height: `${(item.value / maxValue) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600">{item.month}</span>
                </div>
              ))}
            </div>

            {/* Tooltip */}
            {tooltip.show && (
              <div
                className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-medium">{tooltip.month}</div>
                <div className="text-purple-300">Doanh thu: {formatChartCurrency(tooltip.value)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Top 10 sản phẩm bán chạy nhất</h3>
              <p className="text-xs text-gray-500 mt-1">Xếp hạng theo số lượng đã bán</p>
            </div>
            <span
              className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer"
              onClick={fetchAllTopProducts}
            >
              Xem tất cả
            </span>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  {/* Ranking Number */}
                  <div className="flex-shrink-0">
                    <span className="text-2xl font-bold text-purple-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200"
                        onError={(e) => {
                          // Fallback to gradient background if image fails
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gradient-to-r ${product.color} rounded-lg flex items-center justify-center shadow-sm`} style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                      <i className="fas fa-tshirt text-white text-lg"></i>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 truncate max-w-[150px]" title={product.name}>
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">{product.soldCount} đã bán</p>
                    {product.discountPercentage > 0 && product.originalPrice && (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="line-through text-gray-400">
                          {formatCurrency(product.originalPrice)}
                        </span>
                        <span className="bg-red-100 text-red-600 px-1 rounded">
                          -{product.discountPercentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <span className="text-blue-600 font-semibold text-sm block">
                      {formatCurrency(product.discountedPrice || product.price || 0)}
                    </span>
                    <span className="text-green-600 font-semibold text-xs">
                      Doanh thu: {formatCurrency(product.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <i className="fas fa-box-open text-3xl mb-2"></i>
                  <p>Chưa có dữ liệu sản phẩm</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Orders Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Đơn hàng đã giao thành công</h3>
            <p className="text-sm text-gray-600 mt-1">Thống kê các đơn hàng hoàn thành trong tháng này</p>
          </div>
          <button
            onClick={() => fetchCompletedOrders()}
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 px-4 py-2 border border-purple-200 rounded-lg hover:bg-purple-50"
          >
            Xem chi tiết
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-600 text-xl mr-3"></i>
              <div>
                <p className="text-green-800 font-semibold text-2xl">{completedOrdersStats.totalCompleted}</p>
                <p className="text-green-600 text-sm">Đơn đã giao năm {selectedYear}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <i className="fas fa-money-bill-wave text-blue-600 text-xl mr-3"></i>
              <div>
                <p className="text-blue-800 font-semibold text-2xl">
                  {formatCurrency(completedOrdersStats.totalRevenue)}
                </p>
                <p className="text-blue-600 text-sm">Tổng doanh thu năm {selectedYear}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <i className="fas fa-shipping-fast text-purple-600 text-xl mr-3"></i>
              <div>
                <p className="text-purple-800 font-semibold text-2xl">
                  {stats.totalOrders > 0 ? Math.round((completedOrdersStats.totalCompleted / stats.totalOrders) * 100) : 0}%
                </p>
                <p className="text-purple-600 text-sm">Tỷ lệ giao thành công</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Top Products Modal */}
      {showAllProductsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Tất cả sản phẩm bán chạy</h3>
                  <p className="text-sm text-gray-600 mt-1">Xếp hạng theo số lượng sản phẩm đã bán (đơn hàng đã giao)</p>
                </div>
                <button
                  onClick={() => setShowAllProductsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {allTopProducts.length > 0 ? allTopProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      {/* Ranking Number */}
                      <div className="flex-shrink-0">
                        <span className="text-xl font-bold text-purple-600">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 bg-gradient-to-r ${product.color} rounded-lg flex items-center justify-center shadow-sm`} style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                          <i className="fas fa-tshirt text-white text-xl"></i>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-lg" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{product.soldCount} đã bán</p>
                        {product.discountPercentage > 0 && product.originalPrice && (
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <span className="line-through text-gray-400">
                              {formatCurrency(product.originalPrice)}
                            </span>
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                              -{product.discountPercentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="space-y-2">
                        <span className="text-blue-600 font-semibold text-lg block">
                          {formatCurrency(product.discountedPrice || product.price || 0)}
                        </span>
                        <span className="text-green-600 font-semibold text-sm">
                          Doanh thu: {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <i className="fas fa-box-open text-3xl mb-2"></i>
                      <p>Chưa có dữ liệu sản phẩm bán chạy</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAllProductsModal(false)}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

