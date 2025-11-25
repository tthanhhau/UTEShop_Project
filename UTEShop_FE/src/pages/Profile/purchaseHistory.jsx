import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import api from "@/api/axiosConfig";
import { checkOrderReviewed } from "../../api/reviewApi";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cart/cartSlice";

export function PurchaseHistory() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrdersData] = useState([]);
  const [reviewStatus, setReviewStatus] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null); // Thêm state error để xử lý lỗi

  // Xử lý điều hướng đến trang đánh giá sản phẩm
  const handleReviewProduct = (productId, orderId) => {
    navigate(`/products/${productId}?review=true&orderId=${orderId}#reviews`);
  };

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const response = await api.get("/orders");
        const completedOrders = response.data.orders.filter(
          (order) => order.status === 'delivered'
        );
        setOrdersData(completedOrders);

        // Check review status for each completed order
        const reviewStatusMap = {};
        await Promise.all(
          completedOrders.map(async (order) => {
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
        setError(err?.message || 'Lỗi không xác định'); // Xử lý lỗi an toàn
      }
    };

    fetchOrdersData();
  }, []);

  // ===== PHẦN TÌM KIẾM ĐÃ ĐƯỢC CẬP NHẬT TỪ ĐOẠN CODE 1 =====
  const filteredorders = (Array.isArray(orders) ? orders : []).filter((order) => {
    const term = (searchTerm || '').toString().toLowerCase();
    const orderId = (order?._id || '').toString().toLowerCase();
    const items = Array.isArray(order?.items) ? order.items : [];

    const itemMatch = items.some((item) => {
      // Tìm kiếm theo tên sản phẩm (ở 2 vị trí có thể có) và mã sản phẩm
      const name = (item?.name || item?.product?.name || '').toString().toLowerCase();
      const pid = (item?.product?._id || '').toString().toLowerCase();
      return name.includes(term) || pid.includes(term);
    });

    return orderId.includes(term) || itemMatch;
  });
  // ==========================================================

  // Xử lý logic mua lại
  const handleRepurchase = async (order) => {
    setIsAdding(true);
    try {
      // Thêm từng sản phẩm vào giỏ hàng
      for (const item of order.items) {
        await dispatch(
          addToCart({
            productId: item.product._id,
            quantity: item.quantity,
          })
        ).unwrap();
      }
      navigate("/cart");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng");
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
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
          Lịch sử mua hàng
        </h1>
        <p className="text-muted-foreground">
          Xem lại tất cả các sản phẩm bạn đã mua
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-200"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredorders.length === 0 ? (
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
          filteredorders.map((order) => (
            <Card
              key={order._id} // Sử dụng _id từ API thay vì id
              className="overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <CardHeader className=" bg-white ">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Đơn hàng #{order._id}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatPrice(order.totalPrice)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Giao Hàng Thành Công
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                    >
                      <img
                        src={item.product?.images?.[0] || "/placeholder.svg"}
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-md bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {item.product?.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Số lượng: {item.quantity}</span>
                          <span>Giá: {formatPrice(item.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </div>
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
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600 px-4"
                    onClick={() => handleRepurchase(order)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Mua lại
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}