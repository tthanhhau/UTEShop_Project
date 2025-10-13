import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axiosConfig";
import ProductCard from "../components/ProductCard";


const NewArrivalsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const page = searchParams.get('page') || '1';

    // Handle scroll for back to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page,
                    limit: '12',
                    sort: 'newest'
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
                console.error("Lỗi khi lấy sản phẩm mới:", err);
                setError("Không thể tải sản phẩm mới nhất");
            } finally {
                setLoading(false);
            }
        };
        fetchNewArrivals();
    }, [page]);

    const handleProductClick = (productId) => {
        navigate(`/products/${productId}`);
    };

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">NEW ARRIVALS</h1>
                <p className="text-gray-600 text-lg">Khám phá những sản phẩm mới nhất của chúng tôi</p>
                <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
                {pagination.total && (
                    <p className="text-gray-500 mt-4">
                        Hiển thị {products.length} trong tổng số {pagination.total} sản phẩm mới
                    </p>
                )}
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sản phẩm mới</h3>
                    <p className="text-gray-500 mb-4">Vui lòng quay lại sau</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col items-center space-y-4 mb-8">
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
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                }
                            } else {
                                pages.push(1);
                                if (currentPage > 3) {
                                    pages.push('...');
                                }
                                const start = Math.max(2, currentPage - 1);
                                const end = Math.min(totalPages - 1, currentPage + 1);
                                for (let i = start; i <= end; i++) {
                                    pages.push(i);
                                }
                                if (currentPage < totalPages - 2) {
                                    pages.push('...');
                                }
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

            {/* Back Button */}
            <div className="text-center mt-8">
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                    ← Quay về trang chủ
                </button>
            </div>

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
};


export default NewArrivalsPage;
