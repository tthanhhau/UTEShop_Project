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
    const navigate = useNavigate();

    // Get current filters from URL
    const page = searchParams.get('page') || '1';
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';

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
                    ...(brand && { brand })
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
    }, [page, sort, search, category, brand]);

    const handlePageChange = (newPage) => {
        setSearchParams(prev => ({ ...Object.fromEntries(prev), page: newPage.toString() }));
    };

    const handleSortChange = (newSort) => {
        setSearchParams(prev => ({ ...Object.fromEntries(prev), sort: newSort, page: '1' }));
    };

    const handleSearch = (searchTerm) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            search: searchTerm,
            page: '1'
        }));
    };

    const handleCategoryChange = (categoryId) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            category: categoryId,
            page: '1'
        }));
    };

    const handleBrandChange = (brandId) => {
        setSearchParams(prev => ({
            ...Object.fromEntries(prev),
            brand: brandId,
            page: '1'
        }));
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
                </div>

                {/* Sort Options */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'best-selling', label: 'Bán chạy' },
                        { value: 'most-viewed', label: 'Xem nhiều' },
                        { value: 'top-discount', label: 'Khuyến mãi' },
                        { value: 'price-asc', label: 'Giá tăng dần' },
                        { value: 'price-desc', label: 'Giá giảm dần' }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Trước
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 border rounded-lg ${pageNum === pagination.page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}

