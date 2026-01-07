"use client";

import { useState, useEffect } from "react";
import { returnApi } from "@/lib/api";

interface ReturnRequest {
    _id: string;
    order: {
        _id: string;
        totalPrice: number;
        items: Array<{
            product: {
                _id: string;
                name: string;
                images: string[];
                price: number;
            };
            quantity: number;
            size: string;
            price: number;
        }>;
    };
    user: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    reason: string;
    reasonText: string;
    customReason: string;
    status: "pending" | "approved" | "rejected";
    refundAmount: number;
    pointsAwarded: number;
    adminNote: string;
    createdAt: string;
    processedAt: string;
}

interface Stats {
    pending: number;
    approved: number;
    rejected: number;
    totalRefunded: number;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    pending: { label: "Chờ xử lý", bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    approved: { label: "Đã duyệt", bgColor: "bg-green-100", textColor: "text-green-800" },
    rejected: { label: "Từ chối", bgColor: "bg-red-100", textColor: "text-red-800" },
};

export default function ReturnsPage() {
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, totalRefunded: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
            const [requestsRes, statsRes] = await Promise.all([
                returnApi.getAll(params),
                returnApi.getStats(),
            ]);
            setReturnRequests(requestsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Error fetching return requests:", error);
            alert("Không thể tải danh sách yêu cầu hoàn trả");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedRequest) return;

        if (actionType === "reject" && !adminNote.trim()) {
            alert("Vui lòng nhập lý do từ chối");
            return;
        }

        setActionLoading(true);
        try {
            if (actionType === "approve") {
                await returnApi.approve(selectedRequest._id, adminNote);
                alert("Đã duyệt yêu cầu hoàn trả và cộng điểm cho khách hàng");
            } else {
                await returnApi.reject(selectedRequest._id, adminNote);
                alert("Đã từ chối yêu cầu hoàn trả");
            }
            setShowActionModal(false);
            setAdminNote("");
            fetchData();
        } catch (error: any) {
            console.error("Error processing return request:", error);
            alert(error?.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setActionLoading(false);
        }
    };

    const openActionModal = (request: ReturnRequest, type: "approve" | "reject") => {
        setSelectedRequest(request);
        setActionType(type);
        setAdminNote("");
        setShowActionModal(true);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const filteredRequests = returnRequests.filter((request) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            request._id.toLowerCase().includes(searchLower) ||
            request.order?._id?.toLowerCase().includes(searchLower) ||
            request.user?.name?.toLowerCase().includes(searchLower) ||
            request.user?.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <span className="text-orange-500">↩</span> Quản lý đổi trả hàng
                </h1>
                <p className="text-gray-500 mt-1">Xử lý các yêu cầu hoàn trả từ khách hàng</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <span className="text-yellow-600 text-xl">⏳</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Chờ xử lý</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <span className="text-green-600 text-xl">✓</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã duyệt</p>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <span className="text-red-600 text-xl">✕</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Từ chối</p>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <span className="text-blue-600 text-xl">💰</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng điểm hoàn</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalRefunded.toLocaleString("vi-VN")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Tìm theo mã yêu cầu, mã đơn hàng, tên khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-[180px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Từ chối</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã yêu cầu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền hoàn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8">Đang tải...</td>
                            </tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8">
                                    <div className="text-gray-400">📦</div>
                                    <p className="text-gray-500 mt-2">Không có yêu cầu hoàn trả nào</p>
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => {
                                const statusInfo = statusConfig[request.status];
                                return (
                                    <tr key={request._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-sm">#{request._id.slice(-8).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium">{request.user?.name}</p>
                                                <p className="text-sm text-gray-500">{request.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">#{request.order?._id?.slice(-8).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <p className="max-w-[200px] truncate">
                                                {request.reasonText}
                                                {request.customReason && `: ${request.customReason}`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-600">{formatPrice(request.refundAmount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{formatDate(request.createdAt)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                                    title="Xem chi tiết"
                                                >
                                                    👁
                                                </button>
                                                {request.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal(request, "approve")}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                            title="Duyệt"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal(request, "reject")}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                            title="Từ chối"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">Chi tiết yêu cầu hoàn trả</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Mã yêu cầu</p>
                                    <p className="font-mono">#{selectedRequest._id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedRequest.status].bgColor} ${statusConfig[selectedRequest.status].textColor}`}>
                                        {statusConfig[selectedRequest.status].label}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="font-medium">{selectedRequest.user?.name}</p>
                                <p className="text-sm text-gray-500">{selectedRequest.user?.email} • {selectedRequest.user?.phone}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Lý do hoàn trả</p>
                                <p className="font-medium">{selectedRequest.reasonText}</p>
                                {selectedRequest.customReason && (
                                    <p className="text-sm bg-yellow-50 p-2 rounded mt-2">Chi tiết: {selectedRequest.customReason}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-2">Sản phẩm trong đơn</p>
                                <div className="space-y-2">
                                    {selectedRequest.order?.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2 border rounded">
                                            <img
                                                src={item.product?.images?.[0] || "/placeholder.svg"}
                                                alt={item.product?.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{item.product?.name}</p>
                                                <p className="text-sm text-gray-500">Size: {item.size} • SL: {item.quantity} • {formatPrice(item.price)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                <span className="font-medium">Số tiền hoàn trả</span>
                                <span className="text-xl font-bold text-green-600">{formatPrice(selectedRequest.refundAmount)}</span>
                            </div>

                            {selectedRequest.status !== "pending" && selectedRequest.adminNote && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Ghi chú admin</p>
                                    <p>{selectedRequest.adminNote}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {showActionModal && selectedRequest && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
                >
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full mx-4">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {actionType === "approve" ? "Duyệt yêu cầu hoàn trả" : "Từ chối yêu cầu hoàn trả"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {actionType === "approve"
                                    ? `Khách hàng sẽ được cộng ${selectedRequest.refundAmount.toLocaleString("vi-VN")} điểm tích lũy.`
                                    : "Vui lòng nhập lý do từ chối để thông báo cho khách hàng."}
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {actionType === "approve" && (
                                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                                    <span className="text-green-600">✓</span>
                                    <div>
                                        <p className="font-medium text-green-800">Xác nhận duyệt</p>
                                        <p className="text-sm text-green-700">
                                            Số điểm sẽ được cộng: {selectedRequest.refundAmount.toLocaleString("vi-VN")} điểm
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {actionType === "approve" ? "Ghi chú (tùy chọn)" : "Lý do từ chối *"}
                                </label>
                                <textarea
                                    placeholder={actionType === "approve" ? "Nhập ghi chú nếu cần..." : "Nhập lý do từ chối yêu cầu hoàn trả..."}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    rows={3}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {actionType === "reject" && (
                                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                                    <span className="text-yellow-600">⚠</span>
                                    <p className="text-sm text-yellow-800">
                                        Khách hàng sẽ nhận được thông báo về việc từ chối kèm lý do bạn nhập.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg text-white ${actionType === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                                    } disabled:opacity-50`}
                            >
                                {actionLoading ? "Đang xử lý..." : actionType === "approve" ? "Duyệt và cộng điểm" : "Từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
