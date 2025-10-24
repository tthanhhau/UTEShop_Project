import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/api/axiosConfig";
import { checkOrderReviewed } from "../../api/reviewApi";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  Star,
} from "lucide-react";

// Order status mapping
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
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Thêm state error
  const [reviewStatus, setReviewStatus] = useState({}); // Track review status for each order

  //fetch API
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const response = await api.get("/orders");
        setOrdersData(response.data.orders);

        // Check review status for delivered orders
        const deliveredOrders = response.data.orders.filter(
          (order) => order.status === 5
        );
        const reviewStatusMap = {};

        await Promise.all(
          deliveredOrders.map(async (order) => {
            try {
              const reviewCheck = await checkOrderReviewed(order._id);
              reviewStatusMap[order._id] = reviewCheck.hasReview;
            } catch (error) {
              console.error(
                `Error checking review for order ${order._id}:`,
                error
              );
              reviewStatusMap[order._id] = false;
            }
          })
        );

        setReviewStatus(reviewStatusMap);
      } catch (err) {
        console.error("Lỗi khi fetch profile:", err);
        // Cập nhật xử lý lỗi an toàn hơn
        setError(err?.message || "Lỗi không xác định");
      }
    };

    fetchOrdersData();
  }, []);

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
      await api.put(`/orders/${orderId}`);
      setOrdersData((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: 6 } : order
        )
      );
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProduct = (productId, orderId) => {
    navigate(`/products/${productId}?review=true&orderId=${orderId}#reviews`);
  };

  const updateReviewStatus = (orderId) => {
    setReviewStatus((prev) => ({
      ...prev,
      [orderId]: true,
    }));
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
            const statusInfo = orderStatuses[order.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order._id} className="overflow-hidden bg-white">
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
                          <div className="text-sm text-muted-foreground">
                            Số lượng: {item.quantity} ×{" "}
                            {formatPrice(item.price)}
                          </div>
                        </div>
                        {order.status === 5 && (
                          <div className="flex-shrink-0">
                            {reviewStatus[order._id] ? (
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
                                    item.product._id,
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
                      </div>
                    ))}
                  </div>

                  {order.status !== 6 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Tiến độ đơn hàng</h4>
                      <div className="relative">
                        {renderStatusTimeline(order.status)}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        Tổng tiền: {formatPrice(order.totalPrice)}
                      </div>
                      {order.estimatedDelivery &&
                        order.status !== 5 &&
                        order.status !== 6 && (
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
                      <Button variant="outline" size="sm">
                        Chi tiết
                      </Button>
                      {order.status !== 6 && order.status !== 5 && (
                        <Button variant="outline" size="sm">
                          Liên hệ shop
                        </Button>
                      )}
                      {order.status === 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(order._id)}
                          disabled={loading}
                        >
                          Hủy đơn
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
    </div>
  );
}
