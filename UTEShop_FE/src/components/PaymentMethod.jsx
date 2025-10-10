import React, { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

const PaymentMethod = ({
    selectedMethod,
    onMethodChange,
    onPaymentSuccess,
    amount,
    orderId,
    disabled = false
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const paymentMethods = [
        {
            id: 'MOMO',
            name: 'Ví MoMo',
            description: 'Thanh toán qua ví điện tử MoMo',
            icon: '📱'
        },
        {
            id: 'COD',
            name: 'Thanh toán khi nhận hàng (COD)',
            description: 'Thanh toán bằng tiền mặt khi nhận hàng',
            icon: '💵'
        },
        {
            id: 'ZALOPAY',
            name: 'ZaloPay',
            description: 'Thanh toán qua ví điện tử ZaloPay',
            icon: '💙',
            disabled: true // Tạm thời vô hiệu hóa
        }
    ];

    const handleMethodSelect = (methodId) => {
        if (disabled) return;
        onMethodChange(methodId);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Chọn phương thức thanh toán</h3>

            {paymentMethods.map((method) => (
                <Card
                    key={method.id}
                    className={`p-4 cursor-pointer transition-all ${selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        } ${(method.disabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !method.disabled && handleMethodSelect(method.id)}
                >
                    <div className="flex items-center space-x-3">
                        <div className="text-2xl">{method.icon}</div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.id}
                                    checked={selectedMethod === method.id}
                                    onChange={() => handleMethodSelect(method.id)}
                                    disabled={method.disabled || disabled}
                                    className="text-blue-600"
                                />
                                <h4 className="font-medium">{method.name}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                            {method.disabled && (
                                <p className="text-xs text-orange-500 mt-1">Sắp ra mắt</p>
                            )}
                        </div>
                    </div>
                </Card>
            ))}

            {/* Hiển thị thông tin thêm cho từng phương thức */}
            {selectedMethod === 'COD' && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start space-x-2">
                        <div className="text-yellow-600">⚠️</div>
                        <div>
                            <h4 className="font-medium text-yellow-800">Lưu ý thanh toán COD</h4>
                            <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                                <li>Vui lòng chuẩn bị tiền mặt đúng số tiền</li>
                                <li>Kiểm tra hàng hóa trước khi thanh toán</li>
                                {/* <li>Phí ship: 15,000₫</li> */}
                            </ul>
                        </div>
                    </div>
                </Card>
            )}

            {selectedMethod === 'MOMO' && (
                <Card className="p-4 bg-pink-50 border-pink-200">
                    <div className="flex items-start space-x-2">
                        <div className="text-pink-600">📱</div>
                        <div>
                            <h4 className="font-medium text-pink-800">Thanh toán MoMo</h4>
                            <ul className="text-sm text-pink-700 mt-1 list-disc list-inside">
                                <li>Thanh toán nhanh chóng và tiện lợi</li>
                                <li>Bảo mật cao với mã OTP</li>
                                <li>Hỗ trợ QR code và app MoMo</li>
                                <li>Miễn phí giao hàng</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PaymentMethod;
