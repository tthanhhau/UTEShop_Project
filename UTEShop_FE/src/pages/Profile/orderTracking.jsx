import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/api/axiosConfig";
import { checkProductInOrderReviewed } from "../../api/reviewApi";
import { checkReturnEligibility, createReturnRequest, RETURN_REASONS } from "../../api/returnApi";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  Star,
  RotateCcw,
  AlertCircle,
  X,
} from "lucide-react";

// Order status mapping (string to number)
const statusToNumberMap = {
  pending: 1,
  processing: 2,
  prepared: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
};

// Order status info
const orderStatuses = {
  1: {
    label: "Đơn hàng mới",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: ShoppingBag,
  },
  2: {
    label: "Đã xác nhận đơn hàng",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: CheckCircle,
  },
  3: {
    label: "Shop đang chuẩn bị giao hàng",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Package,
  },
  4: {
    label: "Đang giao hàng",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck,
  },
  5: {
    label: "Đã giao thành công",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  6: {
    label: "Hủy đơn hàng",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export function OrderTracking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewStatus, setReviewStatus] = useState({});
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const orderRefs = useRef({});

  // Return request states
  const [returnEligibility, setReturnEligibility] = useState({});
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  //fetch API
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const response = await api.get("/orders");
        setOrdersData(response.data.orders);

        // Check review status for each product in delivered orders
        const deliveredOrders = response.data.orders.filter(
          (order) => {
            const statusNum = typeof order.status === 'string'
              ? statusToNumberMap[order.status] || 0
              : order.status || 0;
            return statusNum === 5;
          }
        );
        const reviewStatusMap = {};

        // Check review status cho từng sản phẩm trong từng đơn hàng
        await Promise.all(
          deliveredOrders.flatMap((order) =>
            order.items.map(async (item) => {
              const productId = item.product?._id || item.product;
              const key = `${order._id}_${productId}`;
              try {
                // Kiểm tra user đã review sản phẩm này trong đơn hàng này chưa
                const result = await checkProductInOrderReviewed(order._id, productId);
                reviewStatusMap[key] = result.hasReview;
              } catch (error) {
                console.error(
                  `Error checking review for order ${order._id} product ${productId}:`,
                  error
                );
                reviewStatusMap[key] = false;
              }
            })
          )
        );

        setReviewStatus(reviewStatusMap);

        // Check return eligibility for delivered orders
        const returnEligibilityMap = {};
        await Promise.all(
          deliveredOrders.map(async (order) => {
            try {
              const result = await checkReturnEligibility(order._id);
              returnEligibilityMap[order._id] = result;
            } catch (error) {
              console.error(`Error checking return eligibility for order ${order._id}:`, error);
              // Nếu lỗi, mặc định không cho đánh giá để an toàn
              returnEligibilityMap[order._id] = { canReturn: false, isReturned: false, error: true };
            }
          })
        );
        setReturnEligibility(returnEligibilityMap);

      } catch (err) {
        console.error("Lỗi khi fetch profile:", err);
        // Cập nhật xử lý lỗi an toàn hơn
        setError(err?.message || "Lỗi không xác định");
      }
    };

    fetchOrdersData();
  }, []);

  // Scroll đến đơn hàng được highlight từ notification
  useEffect(() => {
    const highlightOrderId = searchParams.get('highlight');
    if (highlightOrderId && orders.length > 0) {
      setHighlightedOrderId(highlightOrderId);

      // Đợi DOM render xong rồi scroll
      setTimeout(() => {
        const orderElement = orderRefs.current[highlightOrderId];
        if (orderElement) {
          orderElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Bỏ highlight sau 5 giây
          setTimeout(() => {
            setHighlightedOrderId(null);
            // Xóa query param
            setSearchParams({});
          }, 5000);
        }
      }, 300);
    }
  }, [orders, searchParams, setSearchParams]);

  // ===== PHẦN TÌM KIẾM ĐÃ ĐƯỢC CẬP NHẬT TỪ ĐOẠN CODE 1 =====
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(
    (order) => {
      const term = (searchTerm || "").toString().toLowerCase();
      const orderId = (order?._id || "").toString().toLowerCase();
      const tracking = (order?.trackingNumber || "").toString().toLowerCase();
      const items = Array.isArray(order?.items) ? order.items : [];
      const itemMatch = items.some((item) => {
        // Tìm kiếm tên sản phẩm ở cả item.name và item.product.name
        const name = (item?.name || item?.product?.name || "")
          .toString()
          .toLowerCase();
        return name.includes(term);
      });
      return orderId.includes(term) || tracking.includes(term) || itemMatch;
    }
  );
  // ==========================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusProgress = (status) => {
    if (status === 6) return 0;
    return Math.min((status / 5) * 100, 100);
  };

  const handleCancel = async (orderId) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
      return;
    }
    setLoading(true);
    try {
      const resp = await api.put(`/orders/${orderId}`);
      const data = resp?.data || {};

      // Cập nhật UI đơn hàng -> chuyển trạng thái sang hủy
      setOrdersData((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: 6 } : order
        )
      );

      // Nếu backend đã quy đổi tiền MOMO sang điểm, hiển thị thông báo và chuyển sang trang Profile
      if (data?.pointsAwarded && data.pointsAwarded > 0) {
        alert(
          `Đã hủy đơn và hoàn ${data.convertedAmount?.toLocaleString("vi-VN")} VND thành ${data.pointsAwarded.toLocaleString("vi-VN")} điểm.\n` +
          `Số dư điểm mới: ${data.newUserBalance?.toLocaleString("vi-VN")} điểm.`
        );
        // Điều hướng sang trang Profile để người dùng thấy điểm mới
        navigate("/profile");
      } else {
        // Trường hợp không có quy đổi (ví dụ đơn không phải MOMO), thông báo chung
        alert(data?.message || "Hủy đơn hàng thành công.");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      alert(error?.response?.data?.message || "Hủy đơn hàng thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProduct = (productId, orderId) => {
    navigate(`/products/${productId}?review=true&orderId=${orderId}#reviews`);
  };

  const updateReviewStatus = (orderId, productId) => {
    setReviewStatus((prev) => ({
      ...prev,
      [`${orderId}_${productId}`]: true,
    }));
  };

  // Handle return request
  const handleOpenReturnDialog = (order) => {
    setSelectedOrderForReturn(order);
    setSelectedReason("");
    setCustomReason("");
    setShowReturnDialog(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedReason) {
      alert("Vui lòng chọn lý do hoàn trả");
      return;
    }
    if (selectedReason === "other" && !customReason.trim()) {
      alert("Vui lòng nhập lý do hoàn trả");
      return;
    }

    setReturnLoading(true);
    try {
      await createReturnRequest(
        selectedOrderForReturn._id,
        selectedReason,
        customReason
      );
      alert("Yêu cầu hoàn trả đã được gửi thành công! Admin sẽ xem xét và phản hồi sớm nhất.");
      setShowReturnDialog(false);

      // Update return eligibility
      setReturnEligibility((prev) => ({
        ...prev,
        [selectedOrderForReturn._id]: { canReturn: false, reason: "Đã gửi yêu cầu hoàn trả" },
      }));
    } catch (error) {
      console.error("Error submitting return request:", error);
      alert(error?.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu hoàn trả");
    } finally {
      setReturnLoading(false);
    }
  };

  const renderStatusTimeline = (currentStatus) => {
    const statuses = [1, 2, 3, 4, 5];

    return (
      <div className="flex items-center justify-between mt-4">
        {statuses.map((status, index) => {
          const StatusIcon = orderStatuses[status].icon;
          const isActive = currentStatus >= status && currentStatus !== 6;
          const isCompleted = currentStatus > status && currentStatus !== 6;

          return (
            <div
              key={status}
              className="flex flex-col items-center flex-1 relative"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted || isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                  }`}
              >
                <StatusIcon className="w-4 h-4" />
              </div>
              <div className="text-xs text-center mt-2 max-w-20">
                <span
                  className={
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {orderStatuses[status].label}
                </span>
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={`absolute h-0.5 w-full top-4 left-1/2 ${isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  style={{ transform: "translateX(0)", zIndex: -1 }} // Adjusted for better alignment
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Thêm phần hiển thị lỗi
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2 className="text-xl font-semibold mb-2">Có lỗi xảy ra</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 font-playfair">
          Theo dõi đơn hàng
        </h1>
        <p className="text-muted-foreground">
          Kiểm tra trạng thái và tiến độ giao hàng của các đơn hàng
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng, mã vận đơn hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-100"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Không tìm thấy đơn hàng
              </h3>
              <p className="text-muted-foreground text-center">
                Không có đơn hàng nào phù hợp với từ khóa tìm kiếm của bạn
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            // Convert status string to number
            const statusNumber = typeof order.status === 'string'
              ? statusToNumberMap[order.status] || 1
              : order.status || 1;

            // Kiểm tra an toàn: nếu status không hợp lệ, dùng mặc định
            const statusInfo = orderStatuses[statusNumber] || orderStatuses[1];
            const StatusIcon = statusInfo.icon;

            const isHighlighted = highlightedOrderId === order._id;

            return (
              <Card
                key={order._id}
                ref={(el) => (orderRefs.current[order._id] = el)}
                className={`overflow-hidden bg-white transition-all duration-500 ${isHighlighted
                  ? 'ring-4 ring-yellow-400 border-2 border-yellow-400 shadow-2xl scale-[1.02] animate-pulse'
                  : 'border-2 border-gray-200'
                  }`}
              >
                <CardHeader className="bg-white border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Đơn hàng #{order._id}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>
                          Ngày đặt:{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusInfo.color}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="space-y-3 mb-6">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-white border border-border rounded-lg"
                      >
                        <img
                          src={item.product?.images?.[0] || "/placeholder.svg"}
                          alt={item.product?.name}
                          className="w-12 h-12 object-cover rounded-md bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {item.product?.name}
                          </h4>
                          {item.size && (
                            <div className="text-sm text-blue-600 font-medium">
                              Size: {typeof item.size === 'object' ? item.size.size || item.size : item.size}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Số lượng: {item.quantity} ×{" "}
                            {formatPrice(item.price)}
                          </div>
                        </div>
                        {/* Chỉ hiện nút đánh giá khi đơn đã giao VÀ chưa hoàn trả */}
                        {statusNumber === 5 && !returnEligibility[order._id]?.isReturned && (
                          <div className="flex-shrink-0">
                            {reviewStatus[`${order._id}_${item.product?._id || item.product}`] ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="bg-green-50 border-green-200 text-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Đã đánh giá
                              </Button>
                            ) : (
                              <Button
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                                size="sm"
                                onClick={() =>
                                  handleReviewProduct(
                                    item.product?._id || item.product,
                                    order._id
                                  )
                                }
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Đánh giá
                              </Button>
                            )}
                          </div>
                        )}
                        {/* Hiện badge "Đã hoàn trả" nếu đơn đã được hoàn trả */}
                        {statusNumber === 5 && returnEligibility[order._id]?.isReturned && (
                          <div className="flex-shrink-0">
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Đã hoàn trả
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {statusNumber !== 6 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Tiến độ đơn hàng</h4>
                      <div className="relative">
                        {renderStatusTimeline(statusNumber)}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        Tổng tiền: {formatPrice(order.totalPrice)}
                      </div>
                      {order.estimatedDelivery &&
                        statusNumber !== 5 &&
                        statusNumber !== 6 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Dự kiến giao:{" "}
                            {new Date(
                              new Date(order.createdAt).setDate(
                                new Date(order.createdAt).getDate() + 7
                              )
                            ).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        Chi tiết
                      </Button>
                      {statusNumber !== 6 && statusNumber !== 5 && (
                        <Button variant="outline" size="sm">
                          Liên hệ shop
                        </Button>
                      )}
                      {statusNumber === 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(order._id)}
                          disabled={loading}
                        >
                          Hủy đơn
                        </Button>
                      )}
                      {/* Nút hoàn trả - chỉ hiện khi đã giao và trong 24h */}
                      {statusNumber === 5 && returnEligibility[order._id]?.canReturn && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={() => handleOpenReturnDialog(order)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Hoàn trả ({returnEligibility[order._id]?.hoursRemaining}h còn lại)
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Return Request Modal - Simple HTML Modal */}
      {showReturnDialog && selectedOrderForReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-[500px] w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                Yêu cầu hoàn trả hàng
              </h2>
              <button
                onClick={() => setShowReturnDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Vui lòng cho chúng tôi biết lý do bạn muốn hoàn trả đơn hàng này.
                Số tiền sẽ được quy đổi thành điểm tích lũy (1 điểm = 1 VNĐ).
              </p>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Đơn hàng</p>
                <p className="font-medium">#{selectedOrderForReturn._id}</p>
                <p className="text-sm text-green-600 font-medium">
                  Số tiền hoàn: {formatPrice(selectedOrderForReturn.totalPrice)}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Lý do hoàn trả *</label>
                <div className="space-y-2">
                  {RETURN_REASONS.map((reason) => (
                    <label key={reason.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="returnReason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span>{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === "other" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả chi tiết *</label>
                  <textarea
                    placeholder="Vui lòng mô tả lý do hoàn trả..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Sau khi gửi yêu cầu, admin sẽ xem xét và phản hồi trong vòng 24-48 giờ.
                  Nếu được chấp nhận, số tiền sẽ được cộng vào điểm tích lũy của bạn.
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmitReturn}
                disabled={returnLoading || !selectedReason}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {returnLoading ? "Đang gửi..." : "Gửi yêu cầu hoàn trả"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
