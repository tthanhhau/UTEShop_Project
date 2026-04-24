import { useEffect, useState } from "react";
import shippingApi from "@/api/shippingApi";
import { getOrderDisplayStatus } from "@/utils/orderShippingStatus";
import OrderTracking from "@/components/OrderTracking";

function OrderTrackingTimeline({ orderId, fallbackOrder = null }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return undefined;

    fetchTracking();
    const interval = setInterval(fetchTracking, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await shippingApi.trackByOrderId(orderId);

      if (response.data.success) {
        setTracking(response.data.shipping);
        setError("");
      }
    } catch (err) {
      if (err.response?.status === 400 && fallbackOrder) {
        setError("");
      } else if (err.response?.status === 400) {
        setError("Đơn hàng chưa được giao cho đơn vị vận chuyển");
      } else {
        setError("Không thể tải thông tin vận chuyển");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tracking && !fallbackOrder) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải thông tin vận chuyển...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  const displayStatus = fallbackOrder ? getOrderDisplayStatus(fallbackOrder) : null;

  if (!displayStatus || !fallbackOrder?.status) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold text-gray-800">Theo dõi vận chuyển</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-sm text-gray-600">
            {tracking?.trackingCode && (
              <p>
                Mã vận đơn:
                <span className="ml-2 font-semibold text-gray-800">{tracking.trackingCode}</span>
              </p>
            )}
            {(tracking?.provider || fallbackOrder?.shippingInfo?.provider) && (
              <p>
                Đơn vị vận chuyển:
                <span className="ml-2 font-semibold text-gray-800">
                  {tracking?.provider || fallbackOrder?.shippingInfo?.provider}
                </span>
              </p>
            )}
          </div>
          {orderId && (
            <button
              onClick={fetchTracking}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-1 text-sm text-gray-600">Trạng thái hiện tại:</p>
        <p className="text-lg font-bold text-blue-700">{displayStatus.label}</p>
      </div>

      <OrderTracking status={fallbackOrder.status} />

      <div className="mt-6 border-t border-gray-200 pt-6">
        <p className="text-center text-xs text-gray-500">Thông tin được làm mới tự động mỗi 5 phút</p>
      </div>
    </div>
  );
}

export default OrderTrackingTimeline;
