import React from 'react';
import { formatPrice } from '../utils/formatPrice';

const PaymentSummary = ({ order }) => {
  const shippingFee = Number(order?.shippingInfo?.shippingFee || 0);
  const voucherDiscount = Number(order?.voucherDiscount || 0);
  const usedPointsAmount = Number(order?.usedPointsAmount || 0);
  const itemSubtotal = Array.isArray(order?.items)
    ? order.items.reduce(
      (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
      0
    )
    : 0;

  // Backward-compatible cho đơn cũ từng lưu totalPrice chưa gồm phí ship
  const expectedTotal = Math.max(
    0,
    itemSubtotal - voucherDiscount - usedPointsAmount + shippingFee
  );
  const baseTotal = Number(order?.totalPrice || 0);
  const displayTotal = shippingFee > 0 && baseTotal < expectedTotal ? expectedTotal : baseTotal;
  const pointsUsed = order.usedPointsAmount ? Math.floor(order.usedPointsAmount / 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Chi tiết thanh toán</h2>
      
      {/* Tạm tính */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium">{formatPrice(itemSubtotal)}</span>
        </div>

        {shippingFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span className="font-medium">{formatPrice(shippingFee)}</span>
          </div>
        )}

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
              {formatPrice(displayTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
