import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import api from '../api/axiosConfig';

const MoMoPaymentForm = ({
  amount,
  orderInfo,
  onError,
  disabled = false,
  productDetails,
  cartItems,
  isFromCart,
  quantity,
  customerName,
  shippingAddress,
  phoneNumber,
  selectedProvince,
  selectedDistrict,
  selectedWard,
  shippingFee = 0,
  // === THÊM 3 PROP MỚI ===
  voucher,
  voucherDiscount,
  usedPointsAmount
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, failed

  const handleCreatePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setPaymentError('');

    try {
      const response = await api.post('/payment/create-payment-request', {
        amount: amount,
        orderInfo: orderInfo,
      });

      if (response.data.success) {
        if (response.data.noPaymentRequired) {
          await createOrderAfterPayment(response.data.orderId, response.data.requestId);
          return;
        }

        setPaymentUrl(response.data.payUrl);
        setQrCodeUrl(response.data.qrCodeUrl);
        setShowQR(true);
        setPaymentData({
          orderId: response.data.orderId,
          requestId: response.data.requestId
        });

        // Lưu thông tin thanh toán vào localStorage
        localStorage.setItem('momoPaymentData', JSON.stringify({
          orderId: response.data.orderId,
          requestId: response.data.requestId,
          timestamp: Date.now(),
          productDetails: productDetails,
          cartItems: cartItems,
          isFromCart: isFromCart,
          quantity: quantity,
          customerName: customerName,
          shippingAddress: shippingAddress,
          phoneNumber: phoneNumber,
          selectedProvince: selectedProvince,
          selectedDistrict: selectedDistrict,
          selectedWard: selectedWard,
          shippingFee: shippingFee,
          voucher: voucher,
          voucherDiscount: voucherDiscount,
          usedPointsAmount: usedPointsAmount
        }));

        // Mở popup MoMo
        const paymentWindow = window.open(
          response.data.payUrl,
          'MoMoPayment',
          'width=500,height=700,scrollbars=yes,resizable=yes'
        );

        // Kiểm tra trạng thái thanh toán
        let checkCount = 0;
        const maxChecks = 60; // 5 phút

        // Kiểm tra localStorage để biết khi PaymentSuccessPage signal
        const checkPaymentSuccess = setInterval(async () => {
          const paymentComplete = localStorage.getItem('momoPaymentComplete');
          if (paymentComplete) {
            const data = JSON.parse(paymentComplete);
            if (data.orderId === response.data.orderId && data.success) {
              clearInterval(checkPaymentSuccess);
              localStorage.removeItem('momoPaymentComplete');

              console.log('🎯 Received payment success signal, creating order...');

              // Đóng popup
              if (paymentWindow && !paymentWindow.closed) {
                paymentWindow.close();
              }

              // Tạo order
              try {
                await createOrderAfterPayment(response.data.orderId, response.data.requestId);
              } catch (error) {
                console.error('Error creating order:', error);
                setPaymentError('Thanh toán thành công nhưng tạo đơn hàng thất bại');
              }

              // Reset form
              setShowQR(false);
              setPaymentUrl('');
              setQrCodeUrl('');
              setPaymentData(null);
            }
          }
        }, 1000);

        // Kiểm tra nếu user đóng popup
        const checkClosed = setInterval(() => {
          if (paymentWindow?.closed) {
            clearInterval(checkClosed);
            clearInterval(checkPaymentSuccess);
            setIsProcessing(false);
            setShowQR(false);
          }
        }, 1000);

      } else {
        onError?.(response.data.error || 'Không thể tạo yêu cầu thanh toán');
      }
    } catch (error) {
      console.error('MoMo Payment Error:', error);
      onError?.(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };


  const createOrderAfterPayment = async (momoOrderId, momoRequestId) => {
    try {
      console.log('📦 Creating order with isFromCart:', isFromCart);
      console.log('📦 Creating order with cartItems:', cartItems);
      console.log('📦 Creating order with productDetails:', productDetails);

      let orderData;
      if (isFromCart && cartItems && cartItems.length > 0) {
        // Tạo đơn hàng từ giỏ hàng
        const subtotal = cartItems.reduce((total, item) => {
          const itemPrice = item.product.price * item.quantity;
          const discountAmount = item.product.discountPercentage > 0
            ? itemPrice * item.product.discountPercentage / 100
            : 0;
          return total + (itemPrice - discountAmount);
        }, 0);
        const totalPrice = amount || subtotal + (shippingFee || 0);

        orderData = {
          items: cartItems.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price
          })),
          voucher,
          voucherDiscount,
          usedPointsAmount,
          totalPrice,
          customerName: customerName || 'Tên chưa cập nhật',
          shippingAddress: shippingAddress || 'Địa chỉ chưa cập nhật',
          phoneNumber: phoneNumber || 'Số điện thoại chưa cập nhật',
          shippingInfo: {
            toDistrictId: selectedDistrict?.DistrictID,
            toWardCode: selectedWard?.WardCode,
            province: selectedProvince?.ProvinceName,
            district: '',
            ward: selectedWard?.WardName,
            shippingFee: shippingFee || 0,
          },
          paymentMethod: 'MOMO',
          momoOrderId: momoOrderId,
          momoRequestId: momoRequestId,
        };
      } else {
        // Tạo đơn hàng từ sản phẩm đơn lẻ
        const subtotal = productDetails.price * quantity;
        const discountAmount = productDetails.discountPercentage > 0
          ? subtotal * productDetails.discountPercentage / 100
          : 0;
        const totalPrice = amount || (subtotal - discountAmount) + (shippingFee || 0);

        orderData = {
          items: [{
            product: productDetails._id,
            quantity: quantity,
            price: productDetails.price
          }],
          voucher,
          voucherDiscount,
          usedPointsAmount,
          totalPrice,
          customerName: customerName || 'Tên chưa cập nhật',
          shippingAddress: shippingAddress || 'Địa chỉ chưa cập nhật',
          phoneNumber: phoneNumber || 'Số điện thoại chưa cập nhật',
          shippingInfo: {
            toDistrictId: selectedDistrict?.DistrictID,
            toWardCode: selectedWard?.WardCode,
            province: selectedProvince?.ProvinceName,
            district: '',
            ward: selectedWard?.WardName,
            shippingFee: shippingFee || 0,
          },
          paymentMethod: 'MOMO',
          momoOrderId: momoOrderId,
          momoRequestId: momoRequestId,
        };
      }

      console.log('📤 Sending order data:', orderData);

      const response = await api.post('/orders', orderData);

      if (response.data.success) {
        console.log('✅ Order created successfully, navigating to payment success page...');

        // Lưu thông tin đơn hàng vào localStorage để hiển thị trên trang success
        localStorage.setItem('momoPaymentSuccess', JSON.stringify({
          orderId: response.data.order._id,
          orderData: response.data.order,
          timestamp: Date.now()
        }));

        // Xóa localStorage cũ
        localStorage.removeItem('momoPaymentData');

        // Chuyển đến trang thanh toán thành công
        navigate('/payment/success');
      }
    } catch (error) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setPaymentStatus('failed');
      setPaymentError('Thanh toán thành công nhưng tạo đơn hàng thất bại. Vui lòng liên hệ hỗ trợ.');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📱</div>
          <h3 className="text-lg font-semibold">Thanh toán qua MoMo</h3>
          <p className="text-sm text-gray-600">
            Quét QR code bằng ứng dụng MoMo để thanh toán
          </p>
        </div>

        {/* Hiển thị QR Code khi có popup */}
        {showQR && qrCodeUrl && (
          <div className="text-center mb-4">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
              <img
                src={qrCodeUrl}
                alt="MoMo QR Code"
                className="mx-auto"
                style={{ width: '200px', height: '200px' }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Quét mã QR bằng ứng dụng MoMo hoặc thanh toán trong popup
            </p>

            <div className="mt-3 flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Đang chờ thanh toán...</span>
            </div>
          </div>
        )}

        {/* Hiển thị lỗi */}
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-sm">{paymentError}</span>
            </div>
          </div>
        )}

        {/* Thông tin thanh toán */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Số tiền:</span>
            <span className="text-lg font-bold text-green-600">
              {amount?.toLocaleString()}₫
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium">Nội dung:</span>
            <span className="text-sm text-gray-600">{orderInfo}</span>
          </div>
        </div>

        {/* Nút thanh toán */}
        <div className="mt-4">
          {!showQR ? (
            <Button
              onClick={handleCreatePayment}
              disabled={disabled || isProcessing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang tạo thanh toán...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>📱</span>
                  <span>Thanh toán với MoMo</span>
                </div>
              )}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={() => window.open(paymentUrl, '_blank')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!paymentUrl}
              >
                Mở lại popup MoMo
              </Button>
              <Button
                onClick={() => {
                  setShowQR(false);
                  setPaymentUrl('');
                  setQrCodeUrl('');
                  setPaymentData(null);
                  setPaymentError('');
                }}
                variant="outline"
                className="px-6"
              >
                Hủy
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="text-xs text-gray-500 space-y-1">
        <p>🔒 Thanh toán được bảo mật bởi MoMo</p>
        <p>📱 Cần có ứng dụng MoMo trên điện thoại</p>
        <p>⚡ Thanh toán nhanh chóng và an toàn</p>
      </div>
    </div>
  );
};

export default MoMoPaymentForm;
