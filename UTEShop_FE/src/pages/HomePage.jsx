import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";


const Section = ({ title, products, maxCols = 4, viewAllLink, sectionStyle, totalCount, showViewAll }) => {
    const navigate = useNavigate();

    const getGridCols = () => {
        switch (maxCols) {
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case 4: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
            default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
        }
    };

    const getSectionBgColor = () => {
        switch (sectionStyle) {
            case 'newest': return 'bg-gradient-to-r from-blue-50 to-indigo-50';
            case 'bestselling': return 'bg-gradient-to-r from-green-50 to-emerald-50';
            case 'mostviewed': return 'bg-gradient-to-r from-purple-50 to-pink-50';
            case 'discount': return 'bg-gradient-to-r from-red-50 to-orange-50';
            default: return 'bg-gray-50';
        }
    };

    const getSectionTitleColor = () => {
        switch (sectionStyle) {
            case 'newest': return 'text-blue-700';
            case 'bestselling': return 'text-green-700';
            case 'mostviewed': return 'text-purple-700';
            case 'discount': return 'text-red-700';
            default: return 'text-gray-700';
        }
    };

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className={`rounded-xl p-6 ${getSectionBgColor()}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${getSectionTitleColor()}`}>
                        {title}
                    </h2>
                    {totalCount && (
                        <p className="text-sm text-gray-600 mt-1">
                            {totalCount} sản phẩm có sẵn
                        </p>
                    )}
                </div>
                {showViewAll && viewAllLink && (
                    <button
                        onClick={() => navigate(viewAllLink)}
                        className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-200 text-sm font-medium"
                    >
                        Xem tất cả
                    </button>
                )}
            </div>

            <div className={`grid ${getGridCols()} gap-4`}>
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

const HomePage = () => {
    const [blocks, setBlocks] = useState(null);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axios.get("/products/home-blocks");

                // Log để debug
                console.log("API Response:", res.data);
                console.log("Totals:", res.data.totals);

                setBlocks(res.data);
                setTotals(res.data.totals);
            } catch (err) {
                console.error("Lỗi khi lấy home blocks:", err);
                // Log chi tiết lỗi
                console.error("Error Details:", err.response?.data || err.message);
                setError(err.response?.data?.message || "Không thể tải dữ liệu sản phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchBlocks();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Hiển thị thông báo nếu không có sản phẩm
    if (!blocks || Object.keys(blocks).length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Không có sản phẩm để hiển thị</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng đến với UTEShop</h1>
                <p className="text-gray-600">Khám phá những sản phẩm chất lượng nhất</p>
            </div>

            {/* Chỉ render section nếu có sản phẩm */}
            {blocks.newest && blocks.newest.length > 0 && (
                <Section
                    title="Sản phẩm mới nhất"
                    products={blocks.newest}
                    maxCols={4}
                    viewAllLink="/products?sort=newest"
                    sectionStyle="newest"
                    totalCount={totals?.newest}
                    showViewAll={true}
                />
            )}

            <div className="my-16"></div>

            {blocks.bestSelling && blocks.bestSelling.length > 0 && (
                <Section
                    title="Sản phẩm bán chạy"
                    products={blocks.bestSelling}
                    maxCols={3}
                    viewAllLink="/products?sort=best-selling"
                    sectionStyle="bestselling"
                    totalCount={totals?.bestSelling}
                    showViewAll={true}
                />
            )}

            <div className="my-16"></div>

            {blocks.mostViewed && blocks.mostViewed.length > 0 && (
                <Section
                    title="Sản phẩm xem nhiều"
                    products={blocks.mostViewed}
                    maxCols={4}
                    viewAllLink="/products?sort=most-viewed"
                    sectionStyle="mostviewed"
                    totalCount={totals?.mostViewed}
                    showViewAll={true}
                />
            )}

            <div className="my-16"></div>

            {blocks.topDiscount && blocks.topDiscount.length > 0 && (
                <Section
                    title="Khuyến mãi cao nhất"
                    products={blocks.topDiscount}
                    maxCols={2}
                    viewAllLink="/products?sort=top-discount"
                    sectionStyle="discount"
                    totalCount={totals?.topDiscount}
                    showViewAll={true}
                />
            )}
        </div>
    );
};

export default HomePage;