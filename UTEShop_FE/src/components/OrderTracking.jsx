import React from "react";
import { RiShoppingBag3Line } from "react-icons/ri";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { TbTruckDelivery } from "react-icons/tb";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

const OrderTracking = ({ status }) => {
  const steps = [
    {
      key: "pending",
      label: "Đơn hàng mới",
      icon: RiShoppingBag3Line,
      isActive: status !== "cancelled",
    },
    {
      key: "processing",
      label: "Đã xác nhận đơn hàng",
      icon: HiOutlineClipboardCheck,
      isActive: ["processing", "preparing", "shipped", "delivered"].includes(status),
    },
    {
      key: "preparing",
      label: "Shop đang chuẩn bị giao hàng",
      icon: TbTruckDelivery,
      isActive: ["preparing", "shipped", "delivered"].includes(status),
    },
    {
      key: "shipped",
      label: "Đang giao hàng",
      icon: TbTruckDelivery,
      isActive: ["shipped", "delivered"].includes(status),
    },
    {
      key: "delivered",
      label: "Đã giao thành công",
      icon: IoCheckmarkDoneOutline,
      isActive: status === "delivered",
    },
  ];

  if (status === "cancelled") {
    return (
      <div className="flex items-center justify-center rounded-lg bg-red-50 p-4">
        <span className="font-medium text-red-600">Đơn hàng đã bị hủy</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[760px] items-start justify-between gap-2 py-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const iconClass = step.isActive
            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
            : "border-gray-300 bg-gray-50 text-gray-400";
          const textClass = step.isActive ? "text-gray-900" : "text-gray-400";

          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center px-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>

              {index < steps.length - 1 && (
                <span
                  className={`absolute left-1/2 top-6 h-[2px] w-full translate-x-[50%] ${step.isActive ? "bg-emerald-400" : "bg-gray-200"}`}
                ></span>
              )}

              <div className="mt-3 text-center">
                <p className={`text-sm font-medium ${textClass}`}>{step.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracking;
