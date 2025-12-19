import React from 'react';
import { formatPrice } from '../utils/formatPrice';

const PaymentSummary = ({ order }) => {
  // Tính ngược lại tạm tính từ tổng cộng và các khoản giảm giá
  const subtotal = order.totalPrice + (order.voucherDiscount || 0) + (order.usedPointsAmount || 0);
  const pointsUsed = order.usedPointsAmount ? Math.floor(order.usedPointsAmount / 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Chi tiết thanh toán</h2>
      
      {/* Tạm tính */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {/* Phần giảm giá */}
        <div className="py-3 space-y-3 border-t border-dashed border-gray-200">
          {/* Voucher */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Voucher giảm giá</span>
                {order.voucher ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {order.voucher.code}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">(Không áp dụng)</span>
                )}
              </div>
              {order.voucherDiscount > 0 && (
                <span className="text-green-600">-{formatPrice(order.voucherDiscount)}</span>
              )}
            </div>
            {order.voucher?.description && (
              <p className="text-xs text-gray-500 italic">
                {order.voucher.description}
              </p>
            )}
          </div>

          {/* Điểm tích lũy */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Điểm tích lũy</span>
                {pointsUsed > 0 ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    -{pointsUsed} điểm
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">(Không sử dụng)</span>
                )}
              </div>
              {order.usedPointsAmount > 0 && (
                <span className="text-green-600">-{formatPrice(order.usedPointsAmount)}</span>
              )}
            </div>
            {order.usedPointsAmount > 0 && (
              <p className="text-xs text-gray-500 italic">
                Quy đổi: 1 điểm = 100đ (Đã dùng {pointsUsed} điểm = {formatPrice(order.usedPointsAmount)})
              </p>
            )}
          </div>
        </div>

        {/* Tổng cộng */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Tổng cộng</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;