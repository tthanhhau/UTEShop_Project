const INTERNAL_STATUS_MAP = {
  pending: {
    label: "Đơn hàng mới",
    shortLabel: "Đơn hàng mới",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    iconKey: "shoppingBag",
  },
  processing: {
    label: "Đã xác nhận đơn hàng",
    shortLabel: "Đã xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconKey: "checkCircle",
  },
  preparing: {
    label: "Shop đang chuẩn bị giao hàng",
    shortLabel: "Đang chuẩn bị",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    iconKey: "package",
  },
  shipped: {
    label: "Đang giao hàng",
    shortLabel: "Đang giao",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    iconKey: "truck",
  },
  delivered: {
    label: "Đã giao thành công",
    shortLabel: "Đã giao",
    color: "bg-green-100 text-green-800 border-green-200",
    iconKey: "checkCircle",
  },
  cancelled: {
    label: "Hủy đơn hàng",
    shortLabel: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    iconKey: "xCircle",
  },
};

const GHTK_STATUS_MAP = {
  "-1": {
    label: "GHTK đã hủy đơn vận chuyển",
    shortLabel: "Đã hủy vận chuyển",
    color: "bg-red-100 text-red-800 border-red-200",
    iconKey: "xCircle",
    timelineIndex: 0,
    exceptionLabel: "Đơn vận chuyển đã bị hủy tại GHTK",
  },
  "1": {
    label: "GHTK đã tạo đơn hàng",
    shortLabel: "Đã tạo đơn",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    iconKey: "shoppingBag",
    timelineIndex: 0,
  },
  "2": {
    label: "GHTK đã tiếp nhận",
    shortLabel: "Đã tiếp nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    iconKey: "checkCircle",
    timelineIndex: 1,
  },
  "3": {
    label: "GHTK đã lấy hàng",
    shortLabel: "Đã lấy hàng",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    iconKey: "package",
    timelineIndex: 2,
  },
  "4": {
    label: "GHTK đã nhập kho",
    shortLabel: "Đã nhập kho",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    iconKey: "package",
    timelineIndex: 3,
  },
  "5": {
    label: "GHTK đã xuất kho",
    shortLabel: "Đã xuất kho",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    iconKey: "package",
    timelineIndex: 3,
  },
  "6": {
    label: "GHTK đang giao hàng",
    shortLabel: "Đang giao",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    iconKey: "truck",
    timelineIndex: 4,
  },
  "7": {
    label: "GHTK đã giao thành công",
    shortLabel: "Đã giao",
    color: "bg-green-100 text-green-800 border-green-200",
    iconKey: "checkCircle",
    timelineIndex: 5,
  },
  "8": {
    label: "GHTK đã trả hàng",
    shortLabel: "Đã trả hàng",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    iconKey: "rotateCcw",
    timelineIndex: 4,
    exceptionLabel: "Đơn vận chuyển đang hoặc đã hoàn hàng",
  },
  "9": {
    label: "GHTK không lấy được hàng",
    shortLabel: "Không lấy được",
    color: "bg-red-100 text-red-800 border-red-200",
    iconKey: "xCircle",
    timelineIndex: 1,
    exceptionLabel: "GHTK báo không lấy được hàng từ shop",
  },
  "10": {
    label: "GHTK delay lấy hàng",
    shortLabel: "Delay lấy hàng",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconKey: "clock",
    timelineIndex: 1,
    exceptionLabel: "Đơn vận chuyển đang bị delay khâu lấy hàng",
  },
  "11": {
    label: "GHTK đã đối soát",
    shortLabel: "Đã đối soát",
    color: "bg-green-100 text-green-800 border-green-200",
    iconKey: "checkCircle",
    timelineIndex: 5,
  },
  "12": {
    label: "GHTK đã trả tiền",
    shortLabel: "Đã trả tiền",
    color: "bg-green-100 text-green-800 border-green-200",
    iconKey: "checkCircle",
    timelineIndex: 5,
  },
  "13": {
    label: "GHTK đang chuyển hoàn",
    shortLabel: "Đang hoàn",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    iconKey: "rotateCcw",
    timelineIndex: 4,
    exceptionLabel: "Đơn vận chuyển đang trên đường hoàn về shop",
  },
  "20": {
    label: "GHTK đang trung chuyển hàng",
    shortLabel: "Đang trung chuyển",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    iconKey: "package",
    timelineIndex: 3,
  },
  "21": {
    label: "GHTK đã nhập kho trả",
    shortLabel: "Nhập kho trả",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    iconKey: "rotateCcw",
    timelineIndex: 4,
    exceptionLabel: "Đơn hàng đã vào kho hoàn của GHTK",
  },
  "45": {
    label: "Shipper báo đã giao hàng",
    shortLabel: "Đã giao",
    color: "bg-green-100 text-green-800 border-green-200",
    iconKey: "checkCircle",
    timelineIndex: 5,
  },
  "49": {
    label: "Shipper báo giao hàng thất bại",
    shortLabel: "Giao thất bại",
    color: "bg-red-100 text-red-800 border-red-200",
    iconKey: "xCircle",
    timelineIndex: 4,
    exceptionLabel: "Shipper báo giao hàng thất bại",
  },
  "123": {
    label: "Shipper báo đã lấy hàng",
    shortLabel: "Đã lấy hàng",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    iconKey: "package",
    timelineIndex: 2,
  },
  "127": {
    label: "Shipper báo không lấy được hàng",
    shortLabel: "Không lấy được",
    color: "bg-red-100 text-red-800 border-red-200",
    iconKey: "xCircle",
    timelineIndex: 1,
    exceptionLabel: "Shipper không lấy được hàng từ shop",
  },
  "128": {
    label: "Shipper báo delay lấy hàng",
    shortLabel: "Delay lấy hàng",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconKey: "clock",
    timelineIndex: 1,
    exceptionLabel: "Shipper đang delay ở bước lấy hàng",
  },
};

const GHTK_TIMELINE_STEPS = [
  { key: "created", label: "Đã tạo đơn hàng", codes: ["1"] },
  { key: "received", label: "Đã tiếp nhận", codes: ["2"] },
  { key: "picked", label: "Đã lấy hàng", codes: ["3", "123"] },
  { key: "hub", label: "Đang trung chuyển", codes: ["4", "5", "20"] },
  { key: "shipping", label: "Đang giao hàng", codes: ["6"] },
  { key: "done", label: "Đã giao thành công", codes: ["7", "11", "12", "45"] },
];

const INTERNAL_TIMELINE_STEPS = [
  { key: "pending", label: "Đơn hàng mới" },
  { key: "processing", label: "Đã xác nhận đơn hàng" },
  { key: "preparing", label: "Shop đang chuẩn bị giao hàng" },
  { key: "shipped", label: "Đang giao hàng" },
  { key: "delivered", label: "Đã giao thành công" },
];

const INTERNAL_TIMELINE_INDEX = {
  pending: 0,
  processing: 1,
  preparing: 2,
  shipped: 3,
  delivered: 4,
};

export function getOrderDisplayStatus(order) {
  const shippingInfo = order?.shippingInfo || {};
  const fallback = INTERNAL_STATUS_MAP[order?.status] || INTERNAL_STATUS_MAP.pending;
  return {
    ...fallback,
    code: order?.status || "pending",
    source: "order",
    provider: "",
    trackingCode: shippingInfo.trackingCode || "",
  };
}

export function getOrderProgressTimeline(order) {
  const currentIndex = INTERNAL_TIMELINE_INDEX[order?.status] ?? 0;
  return {
    title: "Tiến độ đơn hàng",
    steps: INTERNAL_TIMELINE_STEPS,
    currentIndex,
    isCancelled: order?.status === "cancelled",
    exceptionLabel: "",
  };
}

function formatTimelineTime(time) {
  if (!time) return "";

  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimelineDateParts(time) {
  if (!time) {
    return {
      date: "",
    };
  }

  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return {
      date: "",
    };
  }

  return {
    date: date.toLocaleDateString("vi-VN"),
  };
}

function resolveStepTime(stepKey, matchedLog, tracking, fallbackOrder, isCurrent, isFuture) {
  if (matchedLog?.time) return matchedLog.time;

  const shippingInfo = fallbackOrder?.shippingInfo || {};

  if (stepKey === "created") {
    return shippingInfo.createdAt || fallbackOrder?.createdAt || "";
  }

  if (stepKey === "done" && isFuture) {
    return (
      shippingInfo.expectedDeliveryTime ||
      tracking?.data?.estimated_deliver_time ||
      tracking?.data?.estimatedDeliverTime ||
      ""
    );
  }

  if (isCurrent) {
    return tracking?.lastUpdatedAt || "";
  }

  return "";
}

export function buildGHTKTrackingTimeline(tracking, fallbackOrder = null) {
  const currentCode = String(tracking?.status ?? "");
  const currentMeta = GHTK_STATUS_MAP[currentCode] || {};
  const currentIndex = Math.max(0, currentMeta.timelineIndex ?? 0);
  const logs = Array.isArray(tracking?.logs) ? tracking.logs : [];

  const normalizedLogs = logs.map((log) => ({
    ...log,
    status: String(log?.status ?? ""),
  }));

  return GHTK_TIMELINE_STEPS.map((step, index) => {
    const matchedLog = normalizedLogs.find((log) => step.codes.includes(log.status));
    const isCurrent = index === currentIndex;
    const isPast = index < currentIndex;
    const isFuture = index > currentIndex;
    const resolvedTime = resolveStepTime(step.key, matchedLog, tracking, fallbackOrder, isCurrent, isFuture);

    return {
      key: step.key,
      label: matchedLog?.message || step.label,
      timeText: formatTimelineTime(resolvedTime),
      timeParts: formatTimelineDateParts(resolvedTime),
      location: matchedLog?.location || "",
      isCurrent,
      isPast,
      isFuture,
      isDone: isCurrent || isPast,
    };
  });
}
