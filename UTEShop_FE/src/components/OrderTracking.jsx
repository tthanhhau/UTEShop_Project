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
    },
    {
      key: "processing",
      label: "Đã xác nhận đơn hàng",
      icon: HiOutlineClipboardCheck,
    },
    {
      key: "preparing",
      label: "Shop đang chuẩn bị giao hàng",
      icon: TbTruckDelivery,
    },
    {
      key: "shipped",
      label: "Đang giao hàng",
      icon: TbTruckDelivery,
    },
    {
      key: "delivered",
      label: "Đã giao thành công",
      icon: IoCheckmarkDoneOutline,
    },
  ];

  const knownKeys = new Set(steps.map((step) => step.key));
  const currentKey = knownKeys.has(status) ? status : "pending";
  const isCompleted = status === "delivered";
  const currentIndex = steps.findIndex((step) => step.key === currentKey);

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
          const isActive = isCompleted || index <= currentIndex;
          const iconClass = isActive
            ? "border-blue-500 bg-blue-50 text-blue-600"
            : "border-gray-300 bg-gray-50 text-gray-400";
          const textClass = isActive ? "text-gray-900" : "text-gray-400";

          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center px-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>

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
