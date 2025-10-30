import React from 'react';
import { RiShoppingBag3Line } from 'react-icons/ri';
import { HiOutlineClipboardCheck } from 'react-icons/hi';
import { TbTruckDelivery } from 'react-icons/tb';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';

const OrderTracking = ({ status }) => {
    const steps = [
        {
            key: 'pending',
            label: 'Đơn hàng mới',
            icon: RiShoppingBag3Line,
            isActive: status !== 'cancelled',
        },
        {
            key: 'processing',
            label: 'Đã xác nhận đơn hàng',
            icon: HiOutlineClipboardCheck,
            isActive: ['processing', 'preparing', 'shipped', 'delivered'].includes(status),
        },
        {
            key: 'preparing',
            label: 'Shop đang chuẩn bị giao hàng',
            icon: TbTruckDelivery,
            isActive: ['preparing', 'shipped', 'delivered'].includes(status),
        },
        {
            key: 'shipped',
            label: 'Đang giao hàng',
            icon: TbTruckDelivery,
            isActive: ['shipped', 'delivered'].includes(status),
        },
        {
            key: 'delivered',
            label: 'Đã giao thành công',
            icon: IoCheckmarkDoneOutline,
            isActive: status === 'delivered',
        },
    ]; if (status === 'cancelled') {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                <span className="text-red-600 font-medium">Đơn hàng đã bị hủy</span>
            </div>
        );
    }

    return (
        <div className="relative mt-8">
            {/* Steps */}
            <div className="flex items-center justify-between relative">
                {steps.map((step, index) => (
                    <div key={step.key} className="flex flex-col items-center">
                        {/* Icon circle */}
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center 
                                ${step.isActive
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            {React.createElement(step.icon, { className: 'w-6 h-6' })}
                        </div>

                        {/* Label */}
                        <div className={`mt-2 text-sm text-center w-32
                            ${step.isActive ? 'text-primary font-medium' : 'text-gray-500'}`}
                        >
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTracking;