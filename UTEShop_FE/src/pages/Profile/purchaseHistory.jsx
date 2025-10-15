import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, Calendar, DollarSign } from "lucide-react";
import api from "@/api/axiosConfig";

// Mock data for order history
const mockorders = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    items: [
      {
        name: "Áo thun nam basic",
        price: 299000,
        quantity: 2,
        image: "/men-s-basic-t-shirt.png",
      },
      {
        name: "Quần jeans slim fit",
        price: 599000,
        quantity: 1,
        image: "/slim-fit-jeans.png",
      },
    ],
    total: 1197000,
    status: "Đã giao thành công",
  },
];

export function PurchaseHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrdersData] = useState([]);
  const [error, setError] = useState(null);
  //fetch api load du lieu
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const response = await api.get("/orders");
        const filteredOrdersStatus = response.data.orders.filter(
          (order) => order.status === 5
        );
        setOrdersData(filteredOrdersStatus);
      } catch (err) {
        console.error("Lỗi khi fetch profile:", err);
        setError(err?.message || 'Lỗi không xác định');
      }
    };

    fetchOrdersData();
  }, []);

  const filteredorders = (Array.isArray(orders) ? orders : []).filter((order) => {
    const term = (searchTerm || '').toString().toLowerCase();
    const orderId = (order?._id || '').toString().toLowerCase();
    const items = Array.isArray(order?.items) ? order.items : [];
    const itemMatch = items.some((item) => {
      const name = (item?.name || item?.product?.name || '').toString().toLowerCase();
      const pid = (item?.product?._id || '').toString().toLowerCase();
      return name.includes(term) || pid.includes(term);
    });
    return orderId.includes(term) || itemMatch;
  });

  // Đã xóa ": number" khỏi tham số price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

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

      {/* Search Bar */}
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

      {/* order History List - grouped by day */}
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
          (() => {
            const sorted = [...filteredorders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const groups = sorted.reduce((acc, order) => {
              const key = new Date(order.createdAt).toLocaleDateString('vi-VN');
              (acc[key] ||= []).push(order);
              return acc;
            }, {});

            return Object.entries(groups).map(([day, ordersInDay]) => (
              <div key={day} className="rounded-2xl border border-gray-200 p-3 sm:p-4">
                <div className="text-sm text-gray-600 mb-3">Ngày mua: {day}</div>
                <div className="space-y-6">
                  {ordersInDay.map((order) => (
                    <Card key={order._id} className="overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-sm">
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
                          {(() => {
                            const term = (searchTerm || '').toString().toLowerCase();
                            const items = Array.isArray(order.items) ? order.items : [];
                            const displayedItems = term
                              ? items.filter((it) => {
                                const name = (it?.name || it?.product?.name || '').toString().toLowerCase();
                                const pid = (it?.product?._id || '').toString().toLowerCase();
                                return name.includes(term) || pid.includes(term);
                              })
                              : items;
                            return displayedItems.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                              >
                                <img
                                  src={item.product?.images?.[0] || "/placeholder.svg"}
                                  alt={item.name}
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
                                <div className="text-right">
                                  <div className="font-semibold text-foreground">
                                    {formatPrice(item.price * item.quantity)}
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                          {(() => {
                            const term = (searchTerm || '').toString().toLowerCase();
                            const items = Array.isArray(order.items) ? order.items : [];
                            const displayedItems = term
                              ? items.filter((it) => {
                                const name = (it?.name || it?.product?.name || '').toString().toLowerCase();
                                const pid = (it?.product?._id || '').toString().toLowerCase();
                                return name.includes(term) || pid.includes(term);
                              })
                              : items;
                            return displayedItems.map((item, idx) => (
                              <Button key={idx} variant="outline" className="bg-transparent hover:bg-gray-100">
                                Đánh giá {item.product?.name?.substring(0, 20)}...
                              </Button>
                            ));
                          })()}
                          <Button variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                            Mua lại
                          </Button>
                          <Button variant="outline" className="bg-transparent hover:bg-gray-100">
                            Xem chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
