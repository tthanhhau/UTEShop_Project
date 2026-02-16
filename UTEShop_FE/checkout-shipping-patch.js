// Patch file - Copy nội dung này vào CheckoutPage.jsx

// 1. Thay thế hàm calculateFinalTotal (dòng ~307)
// TÌM:
/*
const calculateFinalTotal = () => {
  const base = calculateTotalPrice();
  const voucher = vouchers.find(v => v.voucherCode === selectedVoucherId);
  const voucherAmount = calculateVoucherAmount(voucher, base);
  const pointsDeduction = calculatePointsDeduction(base - voucherAmount);
  const final = Math.max(0, base - voucherAmount - pointsDeduction);
  return { base, voucherAmount, pointsDeduction, final };
};
*/

// THAY BẰNG:
const calculateFinalTotal = () => {
    const base = calculateTotalPrice();
    const voucher = vouchers.find(v => v.voucherCode === selectedVoucherId);
    const voucherAmount = calculateVoucherAmount(voucher, base);
    const pointsDeduction = calculatePointsDeduction(base - voucherAmount);
    const subtotal = base - voucherAmount - pointsDeduction;
    const final = Math.max(0, subtotal + shippingFee); // Thêm phí ship
    return { base, voucherAmount, pointsDeduction, shippingFee, final };
};

// 2. Trong hàm handleCreateOrder (dòng ~335), thêm validation cho địa chỉ
// SAU DÒNG:
/*
if (!shippingAddress.trim()) {
  alert("Vui lòng nhập địa chỉ giao hàng");
  return;
}
*/

// THÊM:
if (!selectedDistrict || !selectedWard) {
    alert("Vui lòng chọn đầy đủ địa chỉ giao hàng (Tỉnh/Quận/Phường)");
    return;
}

// 3. Trong orderData (dòng ~380), thêm shippingInfo
// TÌM phần tạo orderData và THÊM trường shippingInfo:
/*
orderData = {
  items: [...],
  totalPrice,
  voucher: voucherData,
  voucherDiscount: voucherAmount || 0,
  usedPointsAmount: pointsDeduction || 0,
  customerName,
  shippingAddress,
  phoneNumber,
  paymentMethod: paymentMethod,
  // THÊM DÒNG NÀY:
  shippingInfo: {
    toDistrictId: selectedDistrict?.DistrictID,
    toWardCode: selectedWard?.WardCode,
    shippingFee: shippingFee,
  },
  codDetails: {
    phoneNumberConfirmed: false,
    additionalNotes: `...`,
  },
};
*/

// 4. Trong phần UI - Thay thế input địa chỉ cũ (dòng ~690)
// TÌM:
/*
<div className="mb-4">
  <label className="block mb-2 font-medium">
    Địa Chỉ Giao Hàng
  </label>
  <input
    type="text"
    value={shippingAddress}
    onChange={(e) => {
      console.log("Shipping address changed:", e.target.value);
      setShippingAddress(e.target.value);
    }}
    placeholder="Nhập địa chỉ giao hàng"
    required
    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
</div>
*/

// THAY BẰNG:
/*
<div className="mb-4">
  <label className="block mb-2 font-medium">
    Địa chỉ chi tiết <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={detailedAddress}
    onChange={handleDetailedAddressChange}
    placeholder="Số nhà, tên đường (VD: 123 Nguyễn Huệ)"
    required
    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
</div>

<div className="mb-4">
  <ShippingAddressSelector
    onAddressChange={handleAddressChange}
    onFeeCalculated={handleFeeCalculated}
  />
</div>

{shippingAddress && (
  <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
    <p className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng đầy đủ:</p>
    <p className="font-medium">{shippingAddress}</p>
  </div>
)}
*/

// 5. Trong Order Summary (dòng ~640), cập nhật hiển thị
// TÌM phần hiển thị total và THAY BẰNG:
/*
<div className="flex justify-between font-bold text-lg">
  <span>Total</span>
  {(() => {
    const { base, voucherAmount, pointsDeduction, shippingFee, final } =
      calculateFinalTotal();
    return (
      <div className="text-right">
        <div className="text-sm text-gray-500">
          Subtotal: {base?.toLocaleString()}₫
        </div>
        {voucherAmount > 0 && (
          <div className="text-sm text-green-600">
            Voucher: -{voucherAmount.toLocaleString()}₫
          </div>
        )}
        {pointsDeduction > 0 && (
          <div className="text-sm text-green-600">
            Points: -{pointsDeduction.toLocaleString()}₫
          </div>
        )}
        {shippingFee > 0 && (
          <div className="text-sm text-blue-600">
            Phí vận chuyển: +{shippingFee.toLocaleString()}₫
          </div>
        )}
        <div className="text-lg font-bold mt-1">
          {final.toLocaleString()}₫
        </div>
      </div>
    );
  })()}
</div>
*/
