import React from "react";
import { getOrderProgressTimeline } from "../utils/orderShippingStatus";

const OrderTracking = ({ order, status }) => {
  const orderData = order || { status };
  const timeline = getOrderProgressTimeline(orderData);

  if (timeline.isCancelled) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Đơn hàng đã bị hủy
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.steps.map((step, index) => {
        const isCurrent = index === timeline.currentIndex;
        const isPassed = index < timeline.currentIndex;
        const mutedClass = isCurrent ? "text-gray-900" : "text-gray-400";
        const dotClass = isCurrent ? "bg-green-600" : isPassed ? "bg-gray-900" : "bg-gray-300";

        return (
          <div key={step.key} className="relative flex gap-4">
            <div className="relative flex w-5 justify-center">
              <span className={`mt-2 h-2.5 w-2.5 rounded-full ${dotClass}`}></span>
              {index < timeline.steps.length - 1 && (
                <span className="absolute top-5 h-full w-px bg-gray-200"></span>
              )}
            </div>
            <div className={`pb-6 text-base ${mutedClass}`}>
              <p className={isCurrent ? "font-semibold" : "font-normal"}>{step.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTracking;
