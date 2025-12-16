import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { getFavoritesAsync, toggleFavoriteAsync } from '../features/favorites/favoriteSlice';
import { addToCart } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';

const FavoritesPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { items, loading, error, currentPage: reduxCurrentPage, totalPages, total } = useSelector(state => state.favorites);

    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // 12 sản phẩm mỗi trang

    useEffect(() => {
        if (user) {
            dispatch(getFavoritesAsync({ page: currentPage, limit: itemsPerPage }));
        }
    }, [dispatch, user, currentPage]);

    const handleRemoveFavorite = async (productId) => {
        // Xác nhận trước khi xóa
        const confirmed = window.confirm('Bạn có chắc chắn muốn bỏ yêu thích sản phẩm này?');
        if (!confirmed) return;

        try {
            await dispatch(toggleFavoriteAsync(productId)).unwrap();
            // Hiển thị thông báo thành công
            alert('Đã bỏ yêu thích sản phẩm!');

            // Nếu đây là sản phẩm cuối cùng trong trang và không phải trang đầu tiên
            if (items.length === 1 && currentPage > 1) {
                // Chuyển về trang trước
                setCurrentPage(currentPage - 1);
            } else {
                // Tải lại danh sách yêu thích ở trang hiện tại
                dispatch(getFavoritesAsync({ page: currentPage, limit: itemsPerPage }));
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('Có lỗi xảy ra khi bỏ yêu thích sản phẩm');
        }
    };

    const handleBuyNow = (product) => {
        // Kiểm tra còn hàng không
        if (product.stock <= 0) {
            alert('Sản phẩm đã hết hàng!');
            return;
        }

        // Chuyển đến trang thanh toán với thông tin sản phẩm
        navigate('/checkout', {
            state: {
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    stock: product.stock,
                    category: product.category,
                    brand: product.brand
                },
                quantity: 1,
                size: null, // Nếu sản phẩm có size, có thể thêm logic chọn size
                fromFavorites: true
            }
        });
    };

    // Xử lý chuyển trang
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // Scroll lên đầu trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Tính toán thông tin phân trang
    const totalItems = total || items.length;
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-semibold mb-2">Vui lòng đăng nhập</h2>
                    <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem sản phẩm yêu thích</p>
                    <Link
                        to="/login"
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="text-center text-red-500">
                    <p>Có lỗi xảy ra: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
                <div className="text-gray-600">
                    {totalItems > 0 ? (
                        <span>Hiển thị {startItem}-{endItem} trong tổng số {totalItems} sản phẩm</span>
                    ) : (
                        <span>0 sản phẩm</span>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-semibold mb-2">Chưa có sản phẩm yêu thích</h2>
                    <p className="text-gray-600 mb-6">Hãy thêm sản phẩm vào danh sách yêu thích của bạn</p>
                    <Link
                        to="/products"
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Xem sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((product) => (
                        <div key={product._id} className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                            <Link to={`/products/${product._id}`} className="block">
                                <div className="aspect-square overflow-hidden rounded-t-lg">
                                    <img
                                        src={product.images?.[0] || '/placeholder-product.jpg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                                        {product.name}
                                    </h3>
                                    <div className="space-y-1">
                                        <div className="text-lg font-bold text-red-600">
                                            {formatPrice(product.price)}
                                        </div>
                                        {product.discountPercentage > 0 && (
                                            <div className="text-xs text-gray-500 line-through">
                                                {formatPrice(product.price / (1 - product.discountPercentage / 100))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Đã bán: {product.soldCount}</span>
                                            <span>Còn lại: {product.stock}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Buy Now Button */}
                            <div className="p-4 pt-0">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleBuyNow(product);
                                    }}
                                    disabled={product.stock <= 0}
                                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${product.stock <= 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {product.stock <= 0 ? 'Hết hàng' : 'Mua ngay'}
                                </button>
                            </div>

                            {/* Remove from favorites button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveFavorite(product._id);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                                title="Bỏ yêu thích"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Favorite indicator */}
                            <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full">
                                <Heart className="w-4 h-4 fill-current" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                    {/* Previous Button */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Trước
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${pageNum === currentPage
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    {/* Next Button */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        Sau
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
