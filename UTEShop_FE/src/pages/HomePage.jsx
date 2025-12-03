import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { getAllBrands } from "../api/brandApi";
import HeroBanner from "../components/HeroBanner";
import BrandSection from "../components/BrandSection";
import CategoryShowcase from "../components/CategoryShowcase";
import FeatureSection from "../components/FeatureSection";
import TestimonialSection from "../components/TestimonialSection";

const HomePage = () => {
    const [blocks, setBlocks] = useState(null);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch products
                const productsRes = await axios.get("/products/home-blocks");
                setBlocks(productsRes.data);

                // Fetch brands
                const brandsData = await getAllBrands();
                setBrands(brandsData);

            } catch (err) {
                console.error("Lỗi khi lấy dữ liệu:", err);
                setError(err.response?.data?.message || "Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải trang chủ...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                    <svg className="w-20 h-20 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã có lỗi xảy ra</h2>
                    <p className="text-red-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all duration-300"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Hero banners - 5 banners về mỹ phẩm
    const heroBanners = [
        {
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&h=800&fit=crop",
            title: "Bảo vệ làn da hoàn hảo",
            description: "Kem chống nắng SPF 50+ - Bảo vệ da tối ưu trước tia UV từ các thương hiệu hàng đầu",
            buttonText: "Khám phá ngay",
            link: "/products?sort=newest"
        },
        {
            image: "https://images.unsplash.com/photo-1556228852-80de8a8b0e80?w=1920&h=800&fit=crop&q=80",
            title: "Kem chống nắng cao cấp",
            description: "Bảo vệ da khỏi tia UVA/UVB - Công thức nhẹ tênh, không gây bết dính",
            buttonText: "Mua ngay",
            link: "/products?category=kem-chong-nang"
        },
        {
            image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1920&h=800&fit=crop",
            title: "Làm sạch sâu & dịu nhẹ",
            description: "Sữa rửa mặt cao cấp - Làm sạch sâu, dưỡng ẩm và làm dịu làn da mỗi ngày",
            buttonText: "Xem sản phẩm",
            link: "/products?sort=best-selling"
        },
        {
            image: "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=1920&h=800&fit=crop&q=80",
            title: "Sữa rửa mặt cho mọi loại da",
            description: "Làm sạch nhẹ nhàng - Cân bằng độ pH tự nhiên, phù hợp cho da nhạy cảm",
            buttonText: "Khám phá",
            link: "/products?category=sua-rua-mat"
        },
        {
            image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&h=800&fit=crop",
            title: "Ưu đãi đặc biệt",
            description: "Giảm giá lên đến 50% cho bộ sưu tập skincare và mỹ phẩm cao cấp",
            buttonText: "Mua ngay",
            link: "/products?sort=top-discount"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Banner - Full Width */}
            <div className="w-full">
                <HeroBanner banners={heroBanners} />
            </div>

            {/* Feature Section */}
            <FeatureSection />

            {/* Brand Section */}
            {brands && brands.length > 0 && (
                <BrandSection brands={brands} />
            )}

            {/* Category Showcases with different themes - Full Width Background */}
            {blocks?.newest && Array.isArray(blocks.newest) && blocks.newest.length > 0 && (
                <CategoryShowcase
                    title="Sản phẩm mới nhất"
                    subtitle="Khám phá những sản phẩm mới nhất từ các thương hiệu hàng đầu"
                    products={blocks.newest}
                    backgroundColor="bg-gradient-to-r from-blue-50 to-indigo-50"
                    textColor="text-blue-900"
                    viewAllLink="/products?sort=newest"
                    maxProducts={8}
                />
            )}

            {blocks?.bestSelling && Array.isArray(blocks.bestSelling) && blocks.bestSelling.length > 0 && (
                <CategoryShowcase
                    title="Sản phẩm bán chạy"
                    subtitle="Những sản phẩm được yêu thích nhất bởi khách hàng"
                    products={blocks.bestSelling}
                    backgroundColor="bg-gradient-to-r from-green-50 to-emerald-50"
                    textColor="text-green-900"
                    viewAllLink="/products?sort=best-selling"
                    maxProducts={6}
                />
            )}

            {/* Testimonial Section */}
            <TestimonialSection />

            {blocks?.mostViewed && Array.isArray(blocks.mostViewed) && blocks.mostViewed.length > 0 && (
                <CategoryShowcase
                    title="Sản phẩm xem nhiều"
                    subtitle="Sản phẩm được quan tâm nhiều nhất trong tuần"
                    products={blocks.mostViewed}
                    backgroundColor="bg-gradient-to-r from-purple-50 to-pink-50"
                    textColor="text-purple-900"
                    viewAllLink="/products?sort=most-viewed"
                    maxProducts={8}
                />
            )}

            {blocks?.topDiscount && Array.isArray(blocks.topDiscount) && blocks.topDiscount.length > 0 && (
                <CategoryShowcase
                    title="Khuyến mãi hot"
                    subtitle="Đừng bỏ lỡ những ưu đãi hấp dẫn nhất"
                    products={blocks.topDiscount}
                    backgroundColor="bg-gradient-to-r from-red-50 to-orange-50"
                    textColor="text-red-900"
                    viewAllLink="/products?sort=top-discount"
                    maxProducts={4}
                />
            )}
        </div>
    );
};

export default HomePage;