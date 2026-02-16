import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder } from "../features/order/orderSlice";
import { updateUserProfile } from "../features/auth/authSlice";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import PaymentMethod from "../components/PaymentMethod";
import MoMoPaymentForm from "../components/MoMoPaymentForm";
import ShippingAddressSelector from "../components/ShippingAddressSelector";
import api from "../api/axiosConfig";

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Lấy thông tin sản phẩm từ state của navigation
  const [productDetails, setProductDetails] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MOMO");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFromCart, setIsFromCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Shipping address states
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [detailedAddress, setDetailedAddress] = useState(""); // Số nhà, tên đường

  // Voucher & loyalty
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const POINT_TO_VND = 1;
  // Fetch thông tin user mới nhất từ API (chỉ 1 lần khi mount)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !currentUser) {
        try {
          const response = await api.get("/user/profile");
          // Chỉ set state, không dispatch để tránh vòng lặp
          setCurrentUser(response.data);
          // Try to initialize vouchers from response if present
          if (
            response.data?.voucherClaims &&
            Array.isArray(response.data.voucherClaims)
          ) {
            setVouchers(response.data.voucherClaims);
          }
        } catch (error) {
          console.error("Lỗi khi fetch thông tin user:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user, currentUser]);

  // also update vouchers when currentUser changes (in case of later updates)
  useEffect(() => {
    if (
      currentUser?.voucherClaims &&
      Array.isArray(currentUser.voucherClaims)
    ) {
      setVouchers(currentUser.voucherClaims);
      console.log("🎫 CheckoutPage - Available vouchers:", currentUser.voucherClaims.length);
    }
  }, [currentUser]);


  // useEffect để xử lý URL và navigation
  useEffect(() => {
    // Xóa URL parameters nếu có (để tránh xử lý callback ở đây)
    const urlParams = new URLSearchParams(window.location.search);
    console.log(
      "🔍 CheckoutPage - Current URL params:",
      Object.fromEntries(urlParams)
    );

    if (urlParams.get("partnerCode") === "MOMO") {
      console.log(
        "🎯 CheckoutPage - Detected MoMo callback, redirecting to PaymentSuccessPage"
      );
      // Redirect đến PaymentSuccessPage nếu có callback từ MoMo
      const currentUrl = new URL(window.location);
      const successUrl = `/payment/success${currentUrl.search}`;
      console.log("🚀 CheckoutPage - Redirecting to:", successUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate(successUrl);
      return;
    }

    // Kiểm tra xem có thông tin sản phẩm được truyền không
    const state = location.state;
    console.log("📦 CheckoutPage - Full state received:", state);
    console.log("📦 CheckoutPage - cartItems:", state?.cartItems);
    console.log("📦 CheckoutPage - fromCart:", state?.fromCart);
    console.log("📦 CheckoutPage - product:", state?.product);

    if (!state || (!state.product && !state.cartItems)) {
      // Nếu không có thông tin sản phẩm, chuyển về trang sản phẩm
      navigate("/products", {
        state: {
          error: "Không có thông tin sản phẩm để thanh toán",
        },
      });
      return;
    }

    // Kiểm tra đăng nhập
    if (!user) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate("/login");
      return;
    }

    // Xử lý trường hợp mua từ giỏ hàng (ưu tiên cartItems nếu có)
    if (state.cartItems && Array.isArray(state.cartItems) && state.cartItems.length > 0) {
      console.log("📦 CheckoutPage - Processing cartItems:", state.cartItems.length, "items");
      setCartItems(state.cartItems);
      setIsFromCart(true);
    } else if (state.product) {
      // Xử lý trường hợp mua trực tiếp
      console.log("📦 CheckoutPage - Processing single product:", state.product.name);
      setProductDetails(state.product);
      setQuantity(state.quantity || 1);
      setSelectedSize(state.selectedSize || state.size || null);
      setIsFromCart(false);
    }
  }, [location, user, navigate, dispatch]);

  // useEffect riêng để điền thông tin user một lần duy nhất
  useEffect(() => {
    if (user && !isInitialized) {
      if (user?.name) {
        setCustomerName(user.name);
      }
      if (user?.address) {
        setShippingAddress(user.address);
      }
      if (user?.phone) {
        setPhoneNumber(user.phone);
      }
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Validate số điện thoại
  const validatePhoneNumber = (phone) => {
    // Loại bỏ tất cả ký tự không phải số
    const cleanPhone = phone.replace(/\D/g, "");

    // Kiểm tra độ dài
    if (cleanPhone.length === 0) {
      return { isValid: false, message: "Vui lòng nhập số điện thoại" };
    }

    if (cleanPhone.length < 10) {
      return { isValid: false, message: "Số điện thoại phải có ít nhất 10 số" };
    }

    if (cleanPhone.length > 10) {
      return { isValid: false, message: "Số điện thoại không được quá 10 số" };
    }

    // Kiểm tra số điện thoại Việt Nam (bắt đầu bằng 0)
    if (!cleanPhone.startsWith("0")) {
      return {
        isValid: false,
        message: "Số điện thoại phải bắt đầu bằng số 0",
      };
    }

    return { isValid: true, message: "" };
  };

  // Handle phone number change
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;

    // Chỉ cho phép nhập số
    const numericValue = value.replace(/\D/g, "");

    setPhoneNumber(numericValue);

    // Validate và hiển thị lỗi
    const validation = validatePhoneNumber(numericValue);
    setPhoneError(validation.message);
  };

  // Handle shipping address change
  const handleAddressChange = (addressData) => {
    setSelectedProvince(addressData.province);
    setSelectedDistrict(addressData.district);
    setSelectedWard(addressData.ward);

    // Tạo địa chỉ đầy đủ để lưu vào database
    if (addressData.province && addressData.district && addressData.ward) {
      const fullAddress = `${detailedAddress ? detailedAddress + ', ' : ''}${addressData.ward.WardName}, ${addressData.district.DistrictName}, ${addressData.province.ProvinceName}`;
      setShippingAddress(fullAddress);
    }
  };

  // Handle shipping fee calculated
  const handleFeeCalculated = (fee) => {
    setShippingFee(fee);
  };

  // Handle detailed address change
  const handleDetailedAddressChange = (e) => {
    const value = e.target.value;
    setDetailedAddress(value);

    // Cập nhật lại địa chỉ đầy đủ
    if (selectedProvince && selectedDistrict && selectedWard) {
      const fullAddress = `${value ? value + ', ' : ''}${selectedWard.WardName}, ${selectedDistrict.DistrictName}, ${selectedProvince.ProvinceName}`;
      setShippingAddress(fullAddress);
    }
  };

  // Tính tổng giá
  const calculateTotalPrice = () => {
    if (isFromCart && cartItems.length > 0) {
      // Tính tổng cho giỏ hàng
      const subtotal = cartItems.reduce((total, item) => {
        const itemPrice = item.product.price * item.quantity;
        const discountAmount =
          item.product.discountPercentage > 0
            ? (itemPrice * item.product.discountPercentage) / 100
            : 0;
        return total + (itemPrice - discountAmount);
      }, 0);
      return subtotal;
    } else if (productDetails) {
      // Tính tổng cho sản phẩm đơn lẻ
      const subtotal = productDetails.price * quantity;
      const discountAmount =
        productDetails.discountPercentage > 0
          ? (subtotal * productDetails.discountPercentage) / 100
          : 0;
      return subtotal - discountAmount;
    }
    return 0;
  };

  // Calculate voucher discount amount based on voucher object and base subtotal
  // Assumptions about voucher shape: { _id, code, type: 'PERCENT'|'AMOUNT', value: number, minOrder?: number }
  const calculateVoucherAmount = (voucher, subtotal) => {
    if (!voucher) return 0;

    // Debug logs
    console.log("🏷️ Voucher Input:", {
      voucher: voucher,
      subtotal: subtotal,
      minOrder: voucher.minOrder,
      discountType: voucher.discountType,
      value: voucher.value
    });

    // minOrder check
    if (voucher.minOrder && subtotal < voucher.minOrder) {
      console.log("❌ Order total does not meet minimum requirement");
      return 0;
    }

    if (voucher.discountType === "PERCENTAGE") {
      const amount = Math.round(subtotal * (voucher.value / 100));
      console.log("💰 Percentage discount calculation:", {
        percentage: voucher.value,
        calculation: `${subtotal} * (${voucher.value} / 100) = ${amount}`
      });
      return amount;
    }

    // Fixed amount discount
    const amount = Math.round(voucher.value || 0);
    console.log("💰 Fixed amount discount:", amount);
    return amount;
  };

  const getAvailablePoints = () => {
    return (
      currentUser?.loyaltyPoints?.balance ?? user?.loyaltyPoints?.balance ?? 0
    );
  };

  // points deduction (in VND) - use all available points (checkbox) but not exceeding subtotal
  const calculatePointsDeduction = (subtotal) => {
    if (!usePoints) return 0;
    const availablePoints = getAvailablePoints();
    const deduction = availablePoints * POINT_TO_VND;
    return Math.min(deduction, subtotal);
  };

  // Final total after applying voucher and/or points
  const calculateFinalTotal = () => {
    const base = calculateTotalPrice();
    // Debug logs for voucher selection
    console.log("🔍 Voucher Selection Debug:", {
      selectedVoucherId,
      availableVouchers: vouchers,
      voucherCodes: vouchers.map(v => v.voucherCode)
    });

    const voucher = vouchers.find(v => v.voucherCode === selectedVoucherId);

    console.log("� Selected Voucher:", voucher);

    const voucherAmount = calculateVoucherAmount(voucher, base);
    const pointsDeduction = calculatePointsDeduction(base - voucherAmount);
    const subtotal = base - voucherAmount - pointsDeduction;
    const final = Math.max(0, subtotal + shippingFee);
    return { base, voucherAmount, pointsDeduction, shippingFee, final };
  };

  // Xử lý lỗi thanh toán MoMo
  const handleMoMoPaymentError = (error) => {
    setPaymentError(error);
    setIsProcessingPayment(false);
  };

  // Xử lý đặt hàng COD
  const handleCreateOrder = async () => {
    // Kiểm tra tên người đặt
    if (!customerName.trim()) {
      alert("Vui lòng nhập tên người đặt");
      return;
    }

    // Kiểm tra địa chỉ
    if (!shippingAddress.trim()) {
      alert("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    // Kiểm tra địa chỉ có cấu trúc (cho shipping API)
    if (!selectedDistrict || !selectedWard) {
      alert("Vui lòng chọn đầy đủ địa chỉ giao hàng (Tỉnh/Quận/Phường)");
      return;
    }

    // Kiểm tra số điện thoại
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
      return;
    }

    // Nếu là thanh toán MoMo, không xử lý ở đây
    if (paymentMethod === "MOMO") {
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError("");

    try {
      const {
        final: totalPrice,
        voucherAmount,
        pointsDeduction,
      } = calculateFinalTotal();

      // Tìm voucher object từ selectedVoucherId
      const selectedVoucher = vouchers.find(
        (v) => v.voucherCode === selectedVoucherId
      );

      // Tạo voucher object để gửi đi
      const voucherData = selectedVoucher ? {
        code: selectedVoucher.voucherCode,
        description: `Giảm ${selectedVoucher.discountType === 'PERCENTAGE' ? selectedVoucher.value + '%' : selectedVoucher.value + 'đ'}`,
        value: selectedVoucher.value,
        discountType: selectedVoucher.discountType,
        minOrder: selectedVoucher.minOrder
      } : null;

      console.log('🎫 Sending voucher data:', voucherData);

      let orderData;
      if (isFromCart && cartItems.length > 0) {
        // Tạo đơn hàng từ giỏ hàng
        orderData = {
          items: cartItems.map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size, // Thêm size
          })),
          totalPrice,
          voucher: voucherData,
          voucherDiscount: voucherAmount || 0,
          usedPointsAmount: pointsDeduction || 0,
          customerName,
          shippingAddress,
          phoneNumber,
          paymentMethod: paymentMethod,
          shippingInfo: {
            toDistrictId: selectedDistrict?.DistrictID,
            toWardCode: selectedWard?.WardCode,
            province: selectedProvince?.ProvinceName,
            district: selectedDistrict?.DistrictName,
            ward: selectedWard?.WardName,
            shippingFee: shippingFee,
          },
          codDetails: {
            phoneNumberConfirmed: false,
            additionalNotes: `Thanh toán cho ${cartItems.length} sản phẩm từ giỏ hàng`,
          },
        };
      } else {
        // Tạo đơn hàng từ sản phẩm đơn lẻ
        orderData = {
          items: [
            {
              product: productDetails._id,
              quantity: quantity,
              price: productDetails.price,
              size: selectedSize, // Thêm size
            },
          ],
          totalPrice,
          voucher: voucherData,
          voucherDiscount: voucherAmount || 0,
          usedPointsAmount: pointsDeduction || 0,
          customerName,
          shippingAddress,
          phoneNumber,
          paymentMethod: paymentMethod,
          shippingInfo: {
            toDistrictId: selectedDistrict?.DistrictID,
            toWardCode: selectedWard?.WardCode,
            province: selectedProvince?.ProvinceName,
            district: selectedDistrict?.DistrictName,
            ward: selectedWard?.WardName,
            shippingFee: shippingFee,
          },
          codDetails: {
            phoneNumberConfirmed: false,
            additionalNotes: `Thanh toán cho sản phẩm: ${productDetails.name}`,
          },
        };
      }

      const result = await dispatch(createOrder(orderData)).unwrap();

      // Lưu thông tin đơn hàng vào localStorage để hiển thị trên trang success
      localStorage.setItem('momoPaymentSuccess', JSON.stringify({
        orderId: result.order._id,
        orderData: result.order,
        timestamp: Date.now()
      }));

      // Chuyển đến trang thanh toán thành công
      navigate("/payment/success");
    } catch (error) {
      console.error("Order Creation Error:", error);

      // Xử lý các loại lỗi khác nhau
      if (error?.code === "NO_AUTH_USER") {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
      } else if (error?.code === "NO_ITEMS") {
        alert("Không có sản phẩm để đặt hàng.");
      } else if (error?.code === "NO_ADDRESS") {
        alert("Vui lòng nhập địa chỉ giao hàng.");
      } else {
        setPaymentError(
          error?.message || "Đặt hàng thất bại. Vui lòng thử lại."
        );
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Nếu không có thông tin sản phẩm, không render gì cả
  if (!productDetails && (!cartItems || cartItems.length === 0)) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Thanh Toán
      </h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Product Details */}
        <Card className="h-fit">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng</h2>

            {/* Product Items */}
            {isFromCart && cartItems.length > 0 ? (
              // Hiển thị nhiều sản phẩm từ giỏ hàng
              <div className="space-y-3 mb-4">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className="relative">
                      <img
                        src={
                          item.product.images?.[0] ||
                          "https://via.placeholder.com/80x80?text=No+Image"
                        }
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {item.product.name}
                      </h3>
                      {item.size && (
                        <p className="text-sm text-gray-600 font-medium">
                          Size: <span className="text-blue-600">{typeof item.size === 'object' ? item.size.size || item.size : item.size}</span>
                        </p>
                      )}
                      <p className="font-bold text-lg">
                        {item.product.price?.toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Hiển thị sản phẩm đơn lẻ
              <div className="flex items-center space-x-4 p-4 border rounded-lg mb-4">
                <div className="relative">
                  <img
                    src={
                      productDetails.images?.[0] ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={productDetails.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {productDetails.name}
                  </h3>
                  {selectedSize && (
                    <p className="text-sm text-gray-600 font-medium">
                      Size: <span className="text-blue-600">{typeof selectedSize === 'object' ? selectedSize.size || selectedSize : selectedSize}</span>
                    </p>
                  )}
                  <p className="font-bold text-lg">
                    {productDetails.price?.toLocaleString()}₫
                  </p>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                {isFromCart && cartItems.length > 0 ? (
                  // Hiển thị summary cho giỏ hàng
                  <>
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div>{item.product.name} x{item.quantity}</div>
                          {item.size && (
                            <div className="text-sm text-blue-600 font-medium">Size: {typeof item.size === 'object' ? item.size.size || item.size : item.size}</div>
                          )}
                        </div>
                        <span className="ml-2">
                          {(
                            item.product.price * item.quantity
                          ).toLocaleString()}
                          ₫
                        </span>
                      </div>
                    ))}
                    {cartItems.some(
                      (item) => item.product.discountPercentage > 0
                    ) && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount</span>
                          <span>
                            -
                            {cartItems
                              .reduce((total, item) => {
                                const discount =
                                  item.product.discountPercentage > 0
                                    ? (item.product.price *
                                      item.quantity *
                                      item.product.discountPercentage) /
                                    100
                                    : 0;
                                return total + discount;
                              }, 0)
                              .toLocaleString()}
                            ₫
                          </span>
                        </div>
                      )}
                  </>
                ) : (
                  // Hiển thị summary cho sản phẩm đơn lẻ
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div>{productDetails.name} x{quantity}</div>
                        {selectedSize && (
                          <div className="text-sm text-blue-600 font-medium">Size: {typeof selectedSize === 'object' ? selectedSize.size || selectedSize : selectedSize}</div>
                        )}
                      </div>
                      <span className="ml-2">
                        {(productDetails.price * quantity).toLocaleString()}₫
                      </span>
                    </div>
                    {productDetails.discountPercentage > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>
                          Discount (-{productDetails.discountPercentage}%)
                        </span>
                        <span>
                          -
                          {Math.round(
                            (productDetails.price *
                              quantity *
                              productDetails.discountPercentage) /
                            100
                          ).toLocaleString()}
                          ₫
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  {/* Show final total after voucher/points */}
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
              </div>
            </div>
          </div>
        </Card>

        {/* Right Column - Checkout Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>

            {/* Tên người đặt */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Tên Người Đặt</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  console.log("Customer name changed:", e.target.value);
                  setCustomerName(e.target.value);
                }}
                placeholder="Nhập tên người đặt"
                required
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Địa chỉ chi tiết */}
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

            {/* Chọn địa chỉ có cấu trúc và tính phí ship */}
            <div className="mb-4">
              <ShippingAddressSelector
                onAddressChange={handleAddressChange}
                onFeeCalculated={handleFeeCalculated}
              />
            </div>

            {/* Hiển thị địa chỉ đầy đủ */}
            {shippingAddress && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng đầy đủ:</p>
                <p className="font-medium">{shippingAddress}</p>
              </div>
            )}

            {/* Số điện thoại */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Số Điện Thoại</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Nhập số điện thoại (VD: 0123456789)"
                required
                className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 ${phoneError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="mb-6">
              <PaymentMethod
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                disabled={isProcessingPayment}
              />
            </div>

            {/* Voucher select */}
            <div className="mb-4">
              <label className="block mb-2 font-medium">Voucher</label>
              <select
                value={selectedVoucherId}
                onChange={(e) => {
                  console.log('Selected Voucher ID:', e.target.value);
                  setSelectedVoucherId(e.target.value);
                }}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn voucher (nếu có) --</option>
                {vouchers
                  .filter(v => {
                    const currentTotal = calculateTotalPrice();
                    const meetsMinOrder = !v.minOrder || currentTotal >= v.minOrder;
                    console.log(`Voucher ${v.voucherCode}:`, {
                      minOrder: v.minOrder,
                      currentTotal,
                      isEligible: meetsMinOrder
                    });
                    return meetsMinOrder;
                  })
                  .map((v) => (
                    <option key={v.voucherCode} value={v.voucherCode}>
                      {v.voucherCode}{" "}
                      {v.discountType === "PERCENTAGE"
                        ? `– ${v.value}%`
                        : `– ${v.value?.toLocaleString?.() || v.value}₫`}{" "}
                      {v.minOrder
                        ? `(min ${v.minOrder?.toLocaleString?.()}₫)`
                        : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* Loyalty points checkbox */}
            <div className="mb-6 flex items-center gap-3">
              <input
                id="use-points"
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="use-points" className="text-sm">
                Sử dụng điểm tích lũy ({getAvailablePoints()} điểm)
              </label>
            </div>

            {/* Hiển thị lỗi thanh toán */}
            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                {paymentError}
              </div>
            )}

            {/* Form thanh toán MoMo */}
            {paymentMethod === "MOMO" && (
              <div className="mb-6">
                <MoMoPaymentForm
                  amount={calculateFinalTotal().final}
                  orderInfo={
                    isFromCart && cartItems.length > 0
                      ? `Thanh toán cho ${cartItems.length} sản phẩm từ giỏ hàng`
                      : `Thanh toán cho sản phẩm: ${productDetails.name}`
                  }
                  onError={handleMoMoPaymentError}
                  disabled={
                    isProcessingPayment ||
                    !customerName.trim() ||
                    !shippingAddress.trim() ||
                    !phoneNumber.trim() ||
                    phoneError
                  }
                  voucher={(() => {
                    const selectedVoucher = vouchers.find(
                      (v) => v._id === selectedVoucherId || v.code === selectedVoucherId
                    );
                    return selectedVoucher ? {
                      code: selectedVoucher.code,
                      description: selectedVoucher.description || `Giảm ${selectedVoucher.type === 'PERCENT' ? selectedVoucher.value + '%' : selectedVoucher.value + 'đ'}`
                    } : null;
                  })()}
                  voucherDiscount={calculateFinalTotal().voucherAmount}
                  usedPointsAmount={calculateFinalTotal().pointsDeduction}
                  productDetails={productDetails}
                  cartItems={cartItems}
                  isFromCart={isFromCart}
                  quantity={quantity}
                  customerName={customerName}
                  shippingAddress={shippingAddress}
                  phoneNumber={phoneNumber}
                  selectedProvince={selectedProvince}
                  selectedDistrict={selectedDistrict}
                  selectedWard={selectedWard}
                  shippingFee={shippingFee}
                />
              </div>
            )}

            {/* Nút đặt hàng cho COD */}
            {paymentMethod !== "MOMO" && (
              <Button
                onClick={handleCreateOrder}
                disabled={isProcessingPayment}
                className="w-full bg-black text-white hover:bg-gray-800 py-3"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  "Đặt hàng →"
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
