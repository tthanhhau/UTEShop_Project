import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../features/order/orderSlice';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [orderInfo, setOrderInfo] = useState(null);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [orderError, setOrderError] = useState('');
    const { user } = useSelector((state) => state.auth);

    // Xử lý tạo order từ MoMo callback
    const handleCreateOrderFromCallback = useCallback(async (momoOrderId) => {
        console.log('🔄 handleCreateOrderFromCallback called with orderId:', momoOrderId);
        console.log('👤 Current user:', user);

        if (!user) {
            console.log('❌ No user found');
            setOrderError('Vui lòng đăng nhập để xử lý đơn hàng');
            return;
        }

        // Lấy thông tin sản phẩm từ localStorage
        const paymentData = localStorage.getItem('momoPaymentSuccess');
        if (!paymentData) {
            setOrderError('Không tìm thấy thông tin thanh toán. Vui lòng thử lại.');
            return;
        }

        try {
            const { productDetails, quantity, shippingAddress } = JSON.parse(paymentData);

            if (!productDetails) {
                setOrderError('Không tìm thấy thông tin sản phẩm. Vui lòng thử lại.');
                return;
            }

            setIsProcessingOrder(true);
            setOrderError('');

            // Tính tổng giá
            const subtotal = productDetails.price * quantity;
            const discountAmount = productDetails.discountPercentage > 0
                ? subtotal * productDetails.discountPercentage / 100
                : 0;
            const totalPrice = subtotal - discountAmount;

            const orderData = {
                items: [{
                    product: productDetails._id,
                    quantity: quantity,
                    price: productDetails.price
                }],
                totalPrice,
                shippingAddress: shippingAddress || 'Địa chỉ chưa cập nhật',
                paymentMethod: 'MOMO',
                momoOrderId: momoOrderId,
            };

            console.log('📦 Creating order with data:', orderData);
            const result = await dispatch(createOrder(orderData)).unwrap();
            console.log('✅ Order created successfully:', result);

            // Xóa dữ liệu localStorage sau khi tạo order thành công
            localStorage.removeItem('momoPaymentSuccess');
            console.log('🗑️ Removed localStorage data');

            // Notify checkout page để đóng popup và chuyển trang
            localStorage.setItem('momoPaymentComplete', JSON.stringify({
                orderId: momoOrderId,
                timestamp: Date.now()
            }));

            console.log('✅ Order created, notifying checkout page');

            // Không tự động chuyển hướng, để người dùng chọn nút
            console.log('✅ Order created successfully, waiting for user action');

        } catch (error) {
            console.error('Order Creation Error from MoMo callback:', error);
            setOrderError(error?.message || 'Tạo đơn hàng thất bại. Vui lòng liên hệ hỗ trợ.');
        } finally {
            setIsProcessingOrder(false);
        }
    }, [user, dispatch, navigate]);

    useEffect(() => {
        // Kiểm tra xem có thông tin đơn hàng từ MoMoPaymentForm không
        const savedOrderInfo = localStorage.getItem('momoPaymentSuccess');
        if (savedOrderInfo) {
            try {
                const orderData = JSON.parse(savedOrderInfo);
                setOrderInfo(orderData);
                console.log('📦 Loaded order info from localStorage:', orderData);

                // Xóa localStorage sau khi đã load
                localStorage.removeItem('momoPaymentSuccess');
            } catch (error) {
                console.error('Error parsing order info:', error);
            }
        }

        // Lấy thông tin thanh toán từ URL params (cho trường hợp callback từ MoMo)
        const partnerCode = searchParams.get('partnerCode');
        const orderId = searchParams.get('orderId');
        const requestId = searchParams.get('requestId');
        const amount = searchParams.get('amount');
        const orderInfoParam = searchParams.get('orderInfo');
        const resultCode = searchParams.get('resultCode');
        const message = searchParams.get('message');

        if (orderId && amount) {
            setPaymentInfo({
                partnerCode,
                orderId,
                requestId,
                amount: parseInt(amount),
                orderInfo: decodeURIComponent(orderInfoParam || ''),
                resultCode,
                message: decodeURIComponent(message || '')
            });

            // Nếu thanh toán thành công - signal về checkout page
            if (resultCode === '0' && partnerCode === 'MOMO') {
                console.log('🎉 MoMo payment successful, signaling checkout page...');

                // Signal checkout page để tạo order
                localStorage.setItem('momoPaymentComplete', JSON.stringify({
                    orderId: orderId,
                    requestId: requestId,
                    timestamp: Date.now(),
                    success: true
                }));

                console.log('✅ Signaled checkout page');
                console.log('✅ Payment successful, showing success page');
            }
        }
    }, [searchParams, handleCreateOrderFromCallback]);

    const handleViewDetails = () => {
        // Điều hướng đến trang theo dõi đơn hàng
        //navigate(`/orders/${order._id}`);
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const isSuccess = paymentInfo?.resultCode === '0' || paymentInfo?.message?.includes('success') || orderInfo !== null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
                <div className="mb-6">
                    {isSuccess ? (
                        <div className="text-6xl mb-4">✅</div>
                    ) : (
                        <div className="text-6xl mb-4">❌</div>
                    )}

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {isSuccess ? 'Bạn đã thanh toán thành công!' : 'Thanh toán thất bại'}
                    </h1>

                    <p className="text-gray-600">
                        {isSuccess
                            ? (isProcessingOrder
                                ? 'Đang tạo đơn hàng...'
                                : 'Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận.')
                            : 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
                        }
                    </p>

                    {isProcessingOrder && (
                        <div className="mt-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Đang xử lý đơn hàng...</p>
                        </div>
                    )}
                </div>

                {orderError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                        <h3 className="font-semibold mb-2">Lỗi xử lý đơn hàng:</h3>
                        <p className="text-sm">{orderError}</p>
                    </div>
                )}

                {(paymentInfo || orderInfo) && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                        <h3 className="font-semibold mb-2">Thông tin giao dịch:</h3>
                        <div className="space-y-1 text-sm">
                            {orderInfo?.orderId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đơn hàng:</span>
                                    <span className="font-medium">{orderInfo.orderId}</span>
                                </div>
                            )}
                            {paymentInfo?.orderId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã giao dịch:</span>
                                    <span className="font-medium">{paymentInfo.orderId}</span>
                                </div>
                            )}
                            {orderInfo?.orderData?.totalPrice && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Số tiền:</span>
                                    <span className="font-medium text-green-600">
                                        {orderInfo.orderData.totalPrice?.toLocaleString()}₫
                                    </span>
                                </div>
                            )}
                            {paymentInfo?.amount && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Số tiền:</span>
                                    <span className="font-medium text-green-600">
                                        {paymentInfo.amount?.toLocaleString()}₫
                                    </span>
                                </div>
                            )}
                            {paymentInfo?.orderInfo && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Nội dung:</span>
                                    <span className="font-medium text-xs">
                                        {paymentInfo.orderInfo}
                                    </span>
                                </div>
                            )}
                            {paymentInfo?.message && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Trạng thái:</span>
                                    <span className={`font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {paymentInfo.message}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <Button
                        onClick={handleViewDetails()}
                        className="w-full"
                    >
                        Xem chi tiết
                    </Button>

                    <Button
                        onClick={handleGoHome}
                        variant="outline"
                        className="w-full"
                    >
                        Trang chủ
                    </Button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    <p>📱 Thanh toán được xử lý bởi MoMo</p>
                    <p>🔒 Thông tin được bảo mật</p>
                </div>
            </Card>
        </div>
    );
};

export default PaymentSuccessPage;
