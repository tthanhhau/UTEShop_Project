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
  prepared: { label: "Shop đang chuẩn bị giao hàng", color: "bg-orange-100 text-orange-800 border-orange-200" },
  shipped: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Đã giao thành công", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
};

const GHTK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  "-1": { label: "GHTK đã hủy đơn vận chuyển", color: "bg-red-100 text-red-800 border-red-200" },
  "1": { label: "GHTK đã tạo đơn hàng", color: "bg-slate-100 text-slate-800 border-slate-200" },
  "2": { label: "GHTK đã tiếp nhận", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "3": { label: "GHTK đã lấy hàng", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  "4": { label: "GHTK đã nhập kho", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "5": { label: "GHTK đã xuất kho", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "6": { label: "GHTK đang giao hàng", color: "bg-violet-100 text-violet-800 border-violet-200" },
  "7": { label: "GHTK đã giao thành công", color: "bg-green-100 text-green-800 border-green-200" },
  "8": { label: "GHTK đã trả hàng", color: "bg-orange-100 text-orange-800 border-orange-200" },
  "9": { label: "GHTK không lấy được hàng", color: "bg-red-100 text-red-800 border-red-200" },
  "10": { label: "GHTK delay lấy hàng", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  "11": { label: "GHTK đã đối soát", color: "bg-green-100 text-green-800 border-green-200" },
  "12": { label: "GHTK đã trả tiền", color: "bg-green-100 text-green-800 border-green-200" },
  "13": { label: "GHTK đang chuyển hoàn", color: "bg-orange-100 text-orange-800 border-orange-200" },
  "20": { label: "GHTK đang trung chuyển hàng", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "21": { label: "GHTK đã nhập kho trả", color: "bg-orange-100 text-orange-800 border-orange-200" },
  "45": { label: "Shipper báo đã giao hàng", color: "bg-green-100 text-green-800 border-green-200" },
  "49": { label: "Shipper báo giao hàng thất bại", color: "bg-red-100 text-red-800 border-red-200" },
  "123": { label: "Shipper báo đã lấy hàng", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  "127": { label: "Shipper báo không lấy được hàng", color: "bg-red-100 text-red-800 border-red-200" },
  "128": { label: "Shipper báo delay lấy hàng", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

export function getOrderDisplayStatus(order?: AnyOrder) {
  const provider = (order?.shippingInfo?.provider || "").toUpperCase();
  const shippingStatus = order?.shippingInfo?.status;

  if (provider === "GHTK" && shippingStatus !== undefined && shippingStatus !== null && shippingStatus !== "") {
    const statusKey = String(shippingStatus);
    return GHTK_STATUS_MAP[statusKey] || {
      label: `Trạng thái GHTK ${statusKey}`,
      color: "bg-slate-100 text-slate-800 border-slate-200",
    };
  }

  return INTERNAL_STATUS_MAP[order?.status || "pending"] || INTERNAL_STATUS_MAP.pending;
}
