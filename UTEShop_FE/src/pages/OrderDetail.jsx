import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderApi from '../api/orderApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { formatPrice } from '../utils/formatPrice';
import OrderTracking from '../components/OrderTracking';
import PaymentSummary from '../components/PaymentSummary';
import { toast } from 'react-toastify';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                const response = await orderApi.getOrderById(orderId);
                if (response.success) {
                    setOrder(response.order);
                } else {
                    throw new Error('Không thể tải thông tin đơn hàng');
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng';
                setError(errorMessage);
                toast.error(errorMessage);
                // Nếu không tìm thấy đơn hàng, chuyển về trang theo dõi đơn hàng
                if (err.response?.status === 404) {
                    setTimeout(() => {
                        navigate('/orders-tracking');
                    }, 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetail();
        }
    }, [orderId, navigate]);

    if (loading) return <div className="flex justify-center items-center min-h-screen">Đang tải...</div>;
    if (error) return <div className="text-red-500 text-center min-h-screen">{error}</div>;
    if (!order) return <div className="text-center min-h-screen">Không tìm thấy đơn hàng</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header với thanh tiến trình */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{order._id}</h1>
                        <p className="text-gray-500 mt-1">
                            Đặt ngày {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-full ${order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </div>
                        <div className={`px-4 py-2 rounded-full ${order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {order.status === 'pending' && 'Chờ xác nhận'}
                            {order.status === 'processing' && 'Đang xử lý'}
                            {order.status === 'shipped' && 'Đang giao hàng'}
                            {order.status === 'delivered' && 'Đã giao hàng'}
                            {order.status === 'cancelled' && 'Đã hủy'}
                        </div>
                    </div>
                </div>

                {/* Thanh tiến trình */}
                <OrderTracking status={order.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Danh sách sản phẩm */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-6">Sản phẩm đã đặt</h2>
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div 
                                    key={item._id} 
                                    className="flex gap-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/products/${item.product._id}`)}
                                >
                                    <img
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-lg mb-1 hover:text-primary transition-colors">{item.product.name}</h3>
                                        <p className="text-gray-600 mb-2">Số lượng: {item.quantity}</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-gray-500">Đơn giá: {formatPrice(item.price)}</p>
                                            <p className="font-medium text-lg">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {/* Thông tin người nhận */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Thông tin người nhận</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-500 text-sm">Họ tên</p>
                                <p className="font-medium">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Số điện thoại</p>
                                <p className="font-medium">{order.customerPhone}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Địa chỉ</p>
                                <p className="font-medium">{order.shippingAddress}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Phương thức thanh toán</p>
                                <p className="font-medium">
                                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' :
                                        order.paymentMethod === 'MOMO' ? 'Ví MoMo' : order.paymentMethod}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin thanh toán */}
                    <PaymentSummary order={order} />
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;