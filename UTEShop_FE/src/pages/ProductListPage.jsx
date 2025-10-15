import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

export default function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    const [showBackToTop, setShowBackToTop] = useState(false);
    const navigate = useNavigate();

    // Get current filters from URL
    const page = searchParams.get('page') || '1';
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const minRating = searchParams.get('minRating') || '';

    // Local UI state to avoid input cursor jump while typing
    const [priceMinInput, setPriceMinInput] = useState(minPrice);
    const [priceMaxInput, setPriceMaxInput] = useState(maxPrice);
    const [ratingInput, setRatingInput] = useState(minRating);

    // Fetch categories and brands
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [categoriesRes, brandsRes] = await Promise.all([
                    axios.get("/categories"),
                    axios.get("/brands")
                ]);
                setCategories(categoriesRes.data);
                setBrands(brandsRes.data);
            } catch (err) {
                console.error("Lỗi khi lấy filters:", err);
            }
        };
        fetchFilters();
    }, []);

    // Handle scroll for back to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page,
                    limit: '12',
                    sort,
                    ...(search && { search }),
                    ...(category && { category }),
                    ...(brand && { brand }),
                    ...(minPrice && { minPrice }),
                    ...(maxPrice && { maxPrice }),
                    ...(minRating && { minRating })
                });

                const res = await axios.get(`/products?${params}`);
                setProducts(res.data.items || []);
                setPagination({
                    page: res.data.page,
                    totalPages: res.data.totalPages,
                    total: res.data.total,
                    limit: res.data.limit
                });
            } catch (err) {
                console.error("Lỗi khi lấy sản phẩm:", err);
                setError("Không thể tải danh sách sản phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [page, sort, search, category, brand, minPrice, maxPrice, minRating]);

    const handlePageChange = (newPage) => {
        setSearchParams(prev => ({ ...Object.fromEntries(prev), page: newPage.toString() }));
        // Scroll to top when changing page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSortChange = (newSort) => {
        setSearchParams(prev => ({ ...Object.fromEntries(prev), sort: newSort, page: '1' }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSearch = (searchTerm) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            search: searchTerm,
            page: '1'
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryChange = (categoryId) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            category: categoryId,
            page: '1'
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBrandChange = (brandId) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            brand: brandId,
            page: '1'
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const commitPriceChange = (field, value) => {
        setSearchParams(prev => {
            const next = { ...Object.fromEntries(prev), page: '1' };
            if (value === '' || value === null) {
                delete next[field];
            } else {
                next[field] = value;
            }
            return next;
        });
    };

    const handleRatingChange = (value) => {
        setRatingInput(value);
        setSearchParams(prev => {
            const next = { ...Object.fromEntries(prev), page: '1' };
            if (!value) delete next.minRating; else next.minRating = value;
            return next;
        });
    };

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

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Tất cả sản phẩm</h1>

                {/* Search and Filter Bar */}

                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    {/*
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    */}

                    {/* Category Filter */}
                    <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    {/* Brand Filter */}
                    <select
                        value={brand}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả thương hiệu</option>
                        {brands.map(br => (
                            <option key={br._id} value={br._id}>
                                {br.name}
                            </option>
                        ))}
                    </select>

                    {/* Price Range */}
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1000"
                            value={priceMinInput}
                            onChange={(e) => setPriceMinInput(e.target.value)}
                            onBlur={() => commitPriceChange('minPrice', priceMinInput)}
                            placeholder="Giá từ"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1000"
                            value={priceMaxInput}
                            onChange={(e) => setPriceMaxInput(e.target.value)}
                            onBlur={() => commitPriceChange('maxPrice', priceMaxInput)}
                            placeholder="đến"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Rating Filter */}
                    <select
                        value={ratingInput}
                        onChange={(e) => handleRatingChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả số sao</option>
                        <option value="4.5">Từ 4.5 sao</option>
                        <option value="4">Từ 4 sao</option>
                        <option value="3.5">Từ 3.5 sao</option>
                        <option value="3">Từ 3 sao</option>
                    </select>
                </div>

                {/* Sort Options */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'best-selling', label: 'Bán chạy' },
                        { value: 'most-viewed', label: 'Xem nhiều' },
                        { value: 'top-discount', label: 'Khuyến mãi' },
                        { value: 'price-asc', label: 'Giá tăng dần' },
                        { value: 'price-desc', label: 'Giá giảm dần' },
                        { value: 'alpha-asc', label: 'A → Z' },
                        { value: 'alpha-desc', label: 'Z → A' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sort === option.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Results Info */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                        Hiển thị {products.length} trong tổng số {pagination.total} sản phẩm
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
                    <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                    <button
                        onClick={() => {
                            setSearchParams({});
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col items-center space-y-4">
                    {/* Page Info */}
                    <div className="text-sm text-gray-600">
                        Trang <span className="font-semibold text-gray-900">{pagination.page}</span> / <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
                        {/* First Page Button - Hidden on mobile */}
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.page === 1}
                            className="hidden sm:flex px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            title="Trang đầu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Previous Page Button */}
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                        >
                            Trước
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                            const currentPage = pagination.page;
                            const totalPages = pagination.totalPages;
                            const pages = [];

                            if (totalPages <= 7) {
                                // Show all pages if 7 or fewer
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                }
                            } else {
                                // Always show first page
                                pages.push(1);

                                if (currentPage > 3) {
                                    pages.push('...');
                                }

                                // Show pages around current page
                                const start = Math.max(2, currentPage - 1);
                                const end = Math.min(totalPages - 1, currentPage + 1);

                                for (let i = start; i <= end; i++) {
                                    pages.push(i);
                                }

                                if (currentPage < totalPages - 2) {
                                    pages.push('...');
                                }

                                // Always show last page
                                pages.push(totalPages);
                            }

                            return pages.map((pageNum, index) => {
                                if (pageNum === '...') {
                                    return (
                                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 sm:px-4 py-2 border rounded-lg font-medium transition-colors text-sm sm:text-base ${pageNum === currentPage
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            });
                        })()}

                        {/* Next Page Button */}
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                        >
                            Sau
                        </button>

                        {/* Last Page Button - Hidden on mobile */}
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.page === pagination.totalPages}
                            className="hidden sm:flex px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            title="Trang cuối"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Jump to Page - Hidden on small mobile */}
                    <div className="hidden xs:flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Đến trang:</span>
                        <input
                            type="number"
                            min="1"
                            max={pagination.totalPages}
                            defaultValue={pagination.page}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    const page = parseInt(e.target.value);
                                    if (page >= 1 && page <= pagination.totalPages) {
                                        handlePageChange(page);
                                    }
                                }
                            }}
                            className="w-16 sm:w-20 px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={pagination.page}
                        />
                        <button
                            onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                const page = parseInt(input.value);
                                if (page >= 1 && page <= pagination.totalPages) {
                                    handlePageChange(page);
                                }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Đi
                        </button>
                    </div>
                </div>
            )}

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-50"
                    title="Lên đầu trang"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            )}
        </div>
    );
}

