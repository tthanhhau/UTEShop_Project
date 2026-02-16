import { useState, useEffect } from 'react';
import shippingApi from '@/api/shippingApi';

/**
 * Component hiển thị timeline theo dõi đơn hàng
 */
function OrderTrackingTimeline({ orderId }) {
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (orderId) {
            fetchTracking();

            // Tự động refresh mỗi 5 phút
            const interval = setInterval(fetchTracking, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [orderId]);

    const fetchTracking = async () => {
        try {
            setLoading(true);
            const response = await shippingApi.trackByOrderId(orderId);

            if (response.data.success) {
                setTracking(response.data.shipping);
                setError('');
            }
        } catch (err) {
            if (err.response?.status === 400) {
                setError('Đơn hàng chưa được giao cho đơn vị vận chuyển');
            } else {
                setError('Không thể tải thông tin vận chuyển');
            }
            console.error('Error fetching tracking:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !tracking) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải thông tin vận chuyển...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">{error}</p>
            </div>
        );
    }

    if (!tracking) {
        return null;
    }

    const getStatusColor = (status) => {
        const statusColors = {
            'picked': 'bg-blue-500',
            'delivering': 'bg-yellow-500',
            'delivered': 'bg-green-500',
            'cancel': 'bg-red-500',
            'return': 'bg-orange-500',
        };
        return statusColors[status] || 'bg-gray-500';
    };

    return (
        <div className="order-tracking-timeline bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Theo dõi vận chuyển
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">
                            Mã vận đơn:
                            <span className="font-semibold text-gray-800 ml-2">
                                {tracking.trackingCode}
                            </span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Đơn vị vận chuyển:
                            <span className="font-semibold text-gray-800 ml-2">
                                {tracking.provider}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={fetchTracking}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Trạng thái hiện tại:</p>
                <p className="text-lg font-bold text-blue-700">
                    {tracking.statusText}
                </p>
            </div>

            {/* Timeline */}
            {tracking.logs && tracking.logs.length > 0 && (
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    <div className="space-y-6">
                        {tracking.logs.map((log, index) => (
                            <div key={index} className="relative flex items-start">
                                {/* Timeline dot */}
                                <div className={`absolute left-0 w-8 h-8 rounded-full ${getStatusColor(log.status)} flex items-center justify-center z-10`}>
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                </div>

                                {/* Content */}
                                <div className="ml-12 flex-1">
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="font-semibold text-gray-800 mb-1">
                                            {log.message || log.status}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(log.time).toLocaleString('vi-VN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                        {log.location && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                📍 {log.location}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No logs */}
            {(!tracking.logs || tracking.logs.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                    <p>Chưa có thông tin vận chuyển chi tiết</p>
                </div>
            )}

            {/* Footer info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    Thông tin cập nhật tự động mỗi 5 phút
                </p>
            </div>
        </div>
    );
}

export default OrderTrackingTimeline;
