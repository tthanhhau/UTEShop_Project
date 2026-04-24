type AnyOrder = {
  status?: string;
  shippingInfo?: {
    provider?: string;
    status?: string | number;
    trackingCode?: string;
  };
};

const INTERNAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Đơn hàng mới", color: "bg-blue-100 text-blue-800 border-blue-200" },
  processing: { label: "Đã xác nhận đơn hàng", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  preparing: { label: "Shop đang chuẩn bị giao hàng", color: "bg-orange-100 text-orange-800 border-orange-200" },
  shipped: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Đã giao thành công", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

export function getOrderDisplayStatus(order?: AnyOrder) {
  return INTERNAL_STATUS_MAP[order?.status || "pending"] || INTERNAL_STATUS_MAP.pending;
}
