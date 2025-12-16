'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell, FaShoppingCart, FaTimes } from 'react-icons/fa';
import axios from '../lib/axios';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    orderId?: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/notifications/unread');
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle notification click - mark as read, delete, and navigate
    const handleNotificationClick = async (notification: Notification) => {
        try {
            setLoading(true);

            // Delete notification (mark as read and remove)
            await axios.delete(`/notifications/${notification._id}`);

            // Update local state
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Close dropdown
            setIsOpen(false);

            // Navigate to orders page with the specific order
            if (notification.orderId) {
                router.push(`/admin/orders?orderId=${notification.orderId}`);
            } else {
                router.push('/admin/orders');
            }
        } catch (error) {
            console.error('Failed to handle notification:', error);
        } finally {
            setLoading(false);
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    // Get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_order':
                return <FaShoppingCart className="text-green-500" />;
            default:
                return <FaBell className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-gray-100 transition-colors"
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
                        <h3 className="font-semibold">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <FaBell className="text-4xl mx-auto mb-2 text-gray-300" />
                                <p>Không có thông báo mới</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => !loading && handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 text-sm">
                                                {notification.title}
                                            </p>
                                            <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-t">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/admin/orders');
                                }}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium w-full text-center"
                            >
                                Xem tất cả đơn hàng
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
