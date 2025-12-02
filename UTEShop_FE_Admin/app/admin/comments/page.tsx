'use client';

import { useState, useEffect, useCallback } from 'react';
import { reviewApi } from '@/lib/api';

export default function ReviewManagement() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalReviews: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        rating: 'all',
        productId: ''
    });

    const [stats, setStats] = useState({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        totalReplied: 0,
        replyRate: 0
    });

    const [replyModal, setReplyModal] = useState({
        isOpen: false,
        reviewId: '',
        review: null as any
    });
    const [replyText, setReplyText] = useState('');

    const fetchReviews = useCallback(async (search = '', rating = 'all', productId = '', page = 1, pageSize = 10) => {
        try {
            if (isFirstLoad) {
                setLoading(true);
            }
            const params: any = {
                search: search || undefined,
                rating: rating !== 'all' ? rating : undefined,
                productId: productId || undefined,
                page,
                limit: pageSize
            };

            console.log('🔍 FETCH REVIEWS - params:', params);
            const response = await reviewApi.getAll(params);

            if (response.data) {
                const reviewsData = response.data.reviews || [];
                const paginationData = {
                    total: response.data.total || 0,
                    page: response.data.page || page,
                    limit: response.data.limit || pageSize,
                    totalPages: response.data.totalPages || 1
                };

                setReviews(reviewsData);
                setPagination({
                    currentPage: paginationData.page,
                    pageSize: paginationData.limit,
                    totalPages: paginationData.totalPages,
                    totalReviews: paginationData.total
                });
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
        } finally {
            if (isFirstLoad) {
                setLoading(false);
                setIsFirstLoad(false);
            }
        }
    }, [isFirstLoad]);

    // Debounce cho search và pagination
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReviews(
                filters.search,
                filters.rating,
                filters.productId,
                pagination.currentPage,
                pagination.pageSize
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search, filters.rating, filters.productId, pagination.currentPage, pagination.pageSize, fetchReviews]);

    // Fetch stats khi component mount
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await reviewApi.getStats();

            if (response.data) {
                setStats({
                    totalReviews: response.data.totalReviews || 0,
                    averageRating: response.data.averageRating || 0,
                    ratingDistribution: response.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    totalReplied: response.data.totalReplied || 0,
                    replyRate: response.data.replyRate || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleReply = async (review: any) => {
        setReplyModal({
            isOpen: true,
            reviewId: review._id,
            review
        });
        setReplyText(review.adminReply?.comment || '');
    };

    const submitReply = async () => {
        try {
            await reviewApi.reply(replyModal.reviewId, replyText);
            alert('Phản hồi thành công!');
            setReplyModal({ isOpen: false, reviewId: '', review: null });
            setReplyText('');
            fetchReviews(filters.search, filters.rating, filters.productId, pagination.currentPage, pagination.pageSize);
            fetchStats();
        } catch (error) {
            console.error('Error replying to review:', error);
            alert('Có lỗi xảy ra khi phản hồi!');
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }

        try {
            await reviewApi.delete(reviewId);
            alert('Xóa đánh giá thành công!');
            fetchReviews(filters.search, filters.rating, filters.productId, pagination.currentPage, pagination.pageSize);
            fetchStats();
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Có lỗi xảy ra khi xóa đánh giá!');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <i
                key={i}
                className={`fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            ></i>
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tổng đánh giá</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalReviews.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <i className="fas fa-star text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Điểm trung bình</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <i className="fas fa-chart-line text-yellow-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Đã phản hồi</p>
                            <p className="text-3xl font-bold text-green-600">{stats.totalReplied}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <i className="fas fa-reply text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tỷ lệ phản hồi</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.replyRate}%</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <i className="fas fa-percentage text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Đánh giá 5 sao</p>
                            <p className="text-3xl font-bold text-indigo-600">{stats.ratingDistribution[5]}</p>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <i className="fas fa-trophy text-indigo-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phân bố đánh giá */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố đánh giá</h3>
                <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating];
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-20">
                                    <span className="text-sm font-medium">{rating}</span>
                                    <i className="fas fa-star text-yellow-400 text-sm"></i>
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                    <div
                                        className="bg-yellow-400 h-6 rounded-full flex items-center justify-end pr-2"
                                        style={{ width: `${percentage}%` }}
                                    >
                                        <span className="text-xs text-white font-medium">{count}</span>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">{percentage.toFixed(1)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-auto md:flex-1 md:max-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Số sao</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={filters.rating}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, rating: e.target.value }));
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                        >
                            <option value="all">Tất cả</option>
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="3">3 sao</option>
                            <option value="2">2 sao</option>
                            <option value="1">1 sao</option>
                        </select>
                    </div>

                    <div className="w-full md:flex-1 md:min-w-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                        <input
                            type="text"
                            placeholder="Nội dung bình luận..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2 invisible">Đặt lại</label>
                        <button
                            onClick={() => {
                                setFilters({ search: '', rating: 'all', productId: '' });
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                            className="w-full md:w-auto bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
                        >
                            Đặt lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Danh sách đánh giá */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Danh sách đánh giá ({pagination.totalReviews})
                    </h3>
                </div>

                <div className="divide-y divide-gray-100">
                    {reviews.map((review: any) => (
                        <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={review.user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"}
                                        alt={review.user?.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{review.user?.name || 'Khách hàng'}</p>
                                        <p className="text-sm text-gray-500">{review.user?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 mb-1">
                                        {renderStars(review.rating)}
                                    </div>
                                    <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-gray-700">{review.comment}</p>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-600">Sản phẩm:</span>
                                <span className="text-sm font-medium text-purple-600">{review.product?.name || 'N/A'}</span>
                            </div>

                            {/* Admin reply */}
                            {review.adminReply && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fas fa-reply text-blue-600"></i>
                                        <span className="text-sm font-medium text-blue-800">Phản hồi từ admin</span>
                                        <span className="text-xs text-blue-600">
                                            ({formatDate(review.adminReply.repliedAt)})
                                        </span>
                                    </div>
                                    <p className="text-gray-700">{review.adminReply.comment}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        bởi {review.adminReply.admin?.name || 'Admin'}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReply(review)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    <i className="fas fa-reply mr-2"></i>
                                    {review.adminReply ? 'Sửa phản hồi' : 'Phản hồi'}
                                </button>
                                <button
                                    onClick={() => handleDelete(review._id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Hiển thị:</span>
                            <select
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                value={pagination.pageSize}
                                onChange={(e) => {
                                    setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), currentPage: 1 }));
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-gray-600">
                                / {pagination.totalReviews} đánh giá
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Trước
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                                            className={`px-3 py-1 border border-gray-300 rounded text-sm ${pagination.currentPage === pageNum
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {replyModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Phản hồi đánh giá
                        </h3>

                        {/* Original review */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <img
                                    src={replyModal.review?.user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"}
                                    alt={replyModal.review?.user?.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">{replyModal.review?.user?.name}</p>
                                    <div className="flex items-center gap-1">
                                        {renderStars(replyModal.review?.rating || 0)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-700">{replyModal.review?.comment}</p>
                        </div>

                        {/* Reply form */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nội dung phản hồi
                            </label>
                            <textarea
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Nhập phản hồi của bạn..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setReplyModal({ isOpen: false, reviewId: '', review: null });
                                    setReplyText('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitReply}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Gửi phản hồi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}