import React, { useState, useEffect } from 'react';
import { Package, Eye, ShoppingCart, Star } from 'lucide-react';
import { getProductStats } from '../api/productStatsApi';

const ProductStats = ({ productId, refreshTrigger = 0 }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                console.log('📊 Fetching stats for product:', productId);
                const response = await getProductStats(productId);
                console.log('📊 Stats response:', response);
                setStats(response);
            } catch (err) {
                console.error('❌ Error fetching stats:', err);
                setError(err.message || 'Có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchStats();
        }
    }, [productId, refreshTrigger]);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-sm">
                Không thể tải thống kê
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const { reviews, purchases, product } = stats;

    // Debug để kiểm tra dữ liệu
    console.log('🔍 ProductStats - Full stats:', stats);
    console.log('🔍 ProductStats - Product data:', product);
    console.log('🔍 ProductStats - Stock value:', product?.stock);

    return (
        <div className="space-y-3">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {/* Rating */}
                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <div>
                        <div className="text-sm text-gray-600">Đánh giá</div>
                        <div className="font-semibold">{reviews.averageRating.toFixed(1)}</div>
                    </div>
                </div>

                {/* Đã bán */}
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-green-500" />
                    <div>
                        <div className="text-sm text-gray-600">Đã bán</div>
                        <div className="font-semibold">{product.soldCount}</div>
                    </div>
                </div>

                {/* Còn lại */}
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <div>
                        <div className="text-sm text-gray-600">Còn lại</div>
                        <div className="font-semibold">{product?.stock || 0}</div>
                    </div>
                </div>

                {/* Lượt xem */}
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <div>
                        <div className="text-sm text-gray-600">Lượt xem</div>
                        <div className="font-semibold">{product.viewCount}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductStats;
