import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchUserOrders,
    cancelOrder
} from '../features/order/orderSlice';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const OrderPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders, isLoading, error } = useSelector((state) => state.order);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        dispatch(fetchUserOrders());
    }, [dispatch, user, navigate]);

    const handleViewOrderDetail = (orderId) => {
        // TODO: Navigate to order detail page
        console.log('View order detail:', orderId);
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            try {
                await dispatch(cancelOrder(orderId)).unwrap();
                alert('Hủy đơn hàng thành công!');
            } catch (error) {
                alert('Không thể hủy đơn hàng: ' + (error.message || 'Lỗi không xác định'));
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return statusStyles[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
        const statusText = {
            pending: 'Chờ xử lý',
            processing: 'Đang xử lý',
            shipped: 'Đang giao hàng',
            delivered: 'Đã giao hàng',
            cancelled: 'Đã hủy'
        };
        return statusText[status] || status;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem đơn hàng</p>
                <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Đơn hàng của tôi</h1>
                <p className="text-gray-600">Quản lý và theo dõi các đơn hàng của bạn</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error.message || error}
                </div>
            )}

            {/* Orders List */}
            {orders && orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <Card key={order._id} className="overflow-hidden">
                            <div className="p-6">
                                {/* Order Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Đơn hàng #{order._id.slice(-8)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Đặt lúc: {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-800 mb-2">Sản phẩm:</h4>
                                    <div className="space-y-2">
                                        {order.items && order.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                                <div className="flex items-center space-x-3">
                                                    {item.product?.images?.[0] && (
                                                        <img
                                                            src={item.product.images[0]}
                                                            alt={item.product?.name || 'Product'}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {item.product?.name || 'Sản phẩm'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Số lượng: {item.quantity} | Giá: {item.price?.toLocaleString()}₫
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-800">
                                                        {((item.price || 0) * (item.quantity || 0)).toLocaleString()}₫
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-1">Địa chỉ giao hàng:</h4>
                                        <p className="text-gray-600">{order.shippingAddress}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-1">Phương thức thanh toán:</h4>
                                        <p className="text-gray-600">
                                            {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Footer */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <div className="text-lg font-bold text-gray-800">
                                        Tổng cộng: {order.totalPrice?.toLocaleString()}₫
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewOrderDetail(order._id)}
                                        >
                                            Xem chi tiết
                                        </Button>
                                        {order.status === 'pending' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancelOrder(order._id)}
                                            >
                                                Hủy đơn hàng
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                    <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!</p>
                    <Button onClick={() => navigate('/products')}>Tiếp tục mua sắm</Button>
                </Card>
            )}
        </div>
    );
};

export default OrderPage;