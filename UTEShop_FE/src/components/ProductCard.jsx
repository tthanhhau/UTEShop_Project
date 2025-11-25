import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import FavoriteButton from './FavoriteButton';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { addingToCart } = useSelector((state) => state.cart);
    const [selectedSize, setSelectedSize] = React.useState(null);
    const [hoveredSize, setHoveredSize] = React.useState(null);

    const originalPrice = product.price;
    const discountedPrice = product.discountPercentage > 0
        ? originalPrice * (1 - product.discountPercentage / 100)
        : originalPrice;

    const handleImageClick = () => {
        navigate(`/products/${product._id}`);
    };

    const handleBuyNow = async (e) => {
        e.stopPropagation();

        if (!user) {
            alert("Vui lòng đăng nhập để mua hàng");
            navigate('/login');
            return;
        }

        if (product.stock <= 0) {
            alert("Sản phẩm đã hết hàng");
            return;
        }

        // Nếu sản phẩm có size nhưng chưa chọn, hiển thị thông báo
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert("Vui lòng chọn size trước khi mua hàng");
            return;
        }

        // Nếu đã chọn size hoặc không có size, chuyển thẳng đến checkout
        navigate('/checkout', {
            state: {
                product: product,
                quantity: 1,
                size: selectedSize
            }
        });
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();

        if (!user) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
            navigate('/login');
            return;
        }

        // Nếu sản phẩm có size nhưng chưa chọn, hiển thị thông báo
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert("Vui lòng chọn size trước khi thêm vào giỏ hàng");
            return;
        }

        // Nếu đã chọn size hoặc không có size, thêm trực tiếp vào giỏ
        try {
            await dispatch(addToCart({
                productId: product._id,
                quantity: 1,
                size: selectedSize
            })).unwrap();

            alert(`Đã thêm sản phẩm${selectedSize ? ` (Size ${selectedSize})` : ''} vào giỏ hàng!`);
            setSelectedSize(null); // Reset size sau khi thêm
        } catch (error) {
            alert(error || "Không thể thêm sản phẩm vào giỏ hàng");
        }
    };



    return (
        <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative overflow-hidden">
                <img
                    src={product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={product.name}
                    onClick={handleImageClick}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                />

                {/* Discount Badge */}
                {product.discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{product.discountPercentage}%
                    </div>
                )}

                {/* Brand Badge */}
                {product.brand && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {product.brand.name}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-red-600">
                        {formatPrice(discountedPrice)}
                    </span>
                    {product.discountPercentage > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Đã bán: {product.soldCount || 0}</span>
                    <span>Lượt xem: {product.viewCount || 0}</span>
                </div>

                {/* Sizes - Display all sizes with hover and selection effects */}
                {product.sizes && product.sizes.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs text-gray-600 mb-1.5 font-medium">Size:</div>
                        <div className="flex flex-wrap gap-1.5">
                            {product.sizes.map((size, index) => {
                                const variant = product.variants?.find(v => v.size === size);
                                const isOutOfStock = variant && variant.stock === 0;
                                const isSelected = selectedSize === size;
                                const isHovered = hoveredSize === size;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isOutOfStock) {
                                                setSelectedSize(isSelected ? null : size);
                                            }
                                        }}
                                        onMouseEnter={() => !isOutOfStock && setHoveredSize(size)}
                                        onMouseLeave={() => setHoveredSize(null)}
                                        disabled={isOutOfStock}
                                        className={`text-xs px-2.5 py-1 rounded border-2 font-medium transition-all duration-200 ${
                                            isOutOfStock
                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                                : isSelected
                                                ? 'border-blue-500 bg-blue-500 text-white shadow-md transform scale-105'
                                                : isHovered
                                                ? 'border-blue-400 bg-blue-50 text-blue-700 transform scale-105'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Stock Status and Favorite */}
                <div className="mb-3 flex items-center justify-between">
                    {product.stock > 0 ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Còn {product.stock} sản phẩm
                        </span>
                    ) : (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            Hết hàng
                        </span>
                    )}
                    <FavoriteButton productId={product._id} size="small" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {product.stock > 0 && (
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                            Mua ngay
                        </button>
                    )}
                    {product.stock > 0 && (
                        <button
                            onClick={handleAddToCart}
                            disabled={addingToCart}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {addingToCart ? "Đang thêm..." : "Thêm giỏ"}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ProductCard;
