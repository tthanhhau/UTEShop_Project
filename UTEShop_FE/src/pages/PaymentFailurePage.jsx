import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        // Lấy thông tin thanh toán từ URL params
        const partnerCode = searchParams.get('partnerCode');
        const orderId = searchParams.get('orderId');
        const requestId = searchParams.get('requestId');
        const amount = searchParams.get('amount');
        const orderInfo = searchParams.get('orderInfo');
        const resultCode = searchParams.get('resultCode');
        const message = searchParams.get('message');

        if (orderId && amount) {
            setPaymentInfo({
                partnerCode,
                orderId,
                requestId,
                amount: parseInt(amount),
                orderInfo: decodeURIComponent(orderInfo || ''),
                resultCode,
                message: decodeURIComponent(message || '')
            });
        }
    }, [searchParams]);

    const handleRetryPayment = () => {
        navigate('/checkout');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
                <div className="mb-6">
                    <div className="text-6xl mb-4">❌</div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Thanh toán thất bại
                    </h1>

                    <p className="text-gray-600">
                        Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
                    </p>
                </div>

                {paymentInfo && (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                        <h3 className="font-semibold mb-2 text-red-800">Thông tin lỗi:</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-medium">{paymentInfo.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số tiền:</span>
                                <span className="font-medium text-red-600">
                                    {paymentInfo.amount?.toLocaleString()}₫
                                </span>
                            </div>
                            {paymentInfo.message && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Lỗi:</span>
                                    <span className="font-medium text-red-600 text-xs">
                                        {paymentInfo.message}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <Button
                        onClick={handleRetryPayment}
                        className="w-full"
                    >
                        Thử thanh toán lại
                    </Button>

                    <Button
                        onClick={handleGoHome}
                        variant="outline"
                        className="w-full"
                    >
                        Về trang chủ
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

export default PaymentFailurePage;
