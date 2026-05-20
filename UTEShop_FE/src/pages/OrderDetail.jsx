import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { toast } from "react-toastify";
import orderApi from "../api/orderApi";
import OrderTrackingTimeline from "../components/OrderTrackingTimeline";
import PaymentSummary from "../components/PaymentSummary";
import { formatPrice } from "../utils/formatPrice";
import { getOrderDisplayStatus } from "../utils/orderShippingStatus";

const badgeColorByPaymentStatus = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-yellow-100 text-yellow-800",
  refunded: "bg-slate-100 text-slate-800",
  processing: "bg-blue-100 text-blue-800",
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getOrderById(orderId);
        if (response.success) {
          setOrder(response.order);
        } else {
          throw new Error("Không thể tải thông tin đơn hàng");
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "Có lỗi xảy ra khi tải thông tin đơn hàng";
        setError(errorMessage);
        toast.error(errorMessage);
        if (err.response?.status === 404) {
          setTimeout(() => {
            navigate("/orders-tracking");
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, navigate]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  if (error) return <div className="min-h-screen text-center text-red-500">{error}</div>;
  if (!order) return <div className="min-h-screen text-center">Không tìm thấy đơn hàng</div>;

  const displayStatus = getOrderDisplayStatus(order);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{order._id}</h1>
            <p className="mt-1 text-gray-500">
              Đặt ngày {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
            {order.shippingInfo?.trackingCode && (
              <p className="mt-1 text-sm font-medium text-blue-600">
                Mã vận đơn {order.shippingInfo.trackingCode} ({order.shippingInfo?.provider || "Đơn vị vận chuyển"})
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`rounded-full px-4 py-2 ${
                badgeColorByPaymentStatus[order.paymentStatus] || "bg-gray-100 text-gray-800"
              }`}
            >
              {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
            </div>
            <div className={`rounded-full border px-4 py-2 ${displayStatus.color}`}>{displayStatus.label}</div>
          </div>
        </div>

        {!order.shippingInfo?.trackingCode && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-gray-600">Tiến độ đơn hàng</p>
            <OrderTrackingTimeline orderId={order._id} fallbackOrder={order} />
          </div>
        )}
      </div>

      {order.shippingInfo?.trackingCode && (
        <div id="tracking" className="mb-8">
          <OrderTrackingTimeline orderId={order._id} fallbackOrder={order} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold">Sản phẩm đã đặt</h2>
            <div className="space-y-6">
              {order.items.map((item) => (
                <div
                  key={item._id}
                  className="flex cursor-pointer gap-6 rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                  onClick={() => navigate(`/products/${item.product._id}`)}
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-medium transition-colors hover:text-primary">
                      {item.product.name}
                    </h3>
                    {item.size && (
                      <p className="mb-1 text-sm font-medium text-blue-600">
                        Size: {typeof item.size === "object" ? item.size.size || item.size : item.size}
                      </p>
                    )}
                    <p className="mb-2 text-gray-600">Số lượng: {item.quantity}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500">Đơn giá: {formatPrice(item.price)}</p>
                      <p className="text-lg font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Thông tin người nhận</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{order.shippingAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium">
                  {order.paymentMethod === "COD"
                    ? "Thanh toán khi nhận hàng"
                    : order.paymentMethod === "MOMO"
                    ? "Ví MoMo"
                    : order.paymentMethod}
                </p>
              </div>
            </div>
          </div>

          <PaymentSummary order={order} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
