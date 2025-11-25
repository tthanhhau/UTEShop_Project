import { useEffect, useState, useRef } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosConfig";
import { addToCart, getCartItemCount } from "../features/cart/cartSlice";
import { addViewedProductAsync } from "../features/viewedProducts/viewedProductSlice";
import { Button } from "../components/ui/button";
import { formatPrice } from "../utils/formatPrice";
import FavoriteButton from "../components/FavoriteButton";
import ProductStats from "../components/ProductStats";
import SimilarProducts from "../components/SimilarProducts";
import ReviewSection from "../components/ReviewSection";

// Tạm thời mock toast nếu chưa có
const toast = {
  success: (message) => alert(message),
  error: (message) => alert(message),
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { addingToCart } = useSelector((state) => state.cart);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const viewCountCalled = useRef(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Reset view count flag when ID changes
        viewCountCalled.current = false;

        // Lấy thông tin sản phẩm
        const productRes = await axios.get(`/products/${id}`);
        setProduct(productRes.data);

        // Tăng view count chỉ một lần
        if (!viewCountCalled.current) {
          viewCountCalled.current = true;
          axios
            .post(`/products/${id}/view`)
            .catch((err) => console.error("Lỗi khi tăng view:", err));
        }

        // Thêm vào danh sách đã xem nếu user đã đăng nhập
        if (user) {
          dispatch(addViewedProductAsync(id)).catch((err) =>
            console.error("Lỗi khi thêm vào danh sách đã xem:", err)
          );
        }
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, user, dispatch]);

  // === USE EFFECT 2: TẢI RIÊNG PHẦN ĐÁNH GIÁ (chạy khi ID hoặc trigger thay đổi) ===
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRes = await axios.get(`/reviews/${id}`);
        console.log("📦 API Response:", reviewsRes.data);
        // Destructure response data
        const { reviews, stats, total, totalPages, page, limit } = reviewsRes.data;
        console.log("📊 Reviews count:", reviews?.length); // Thêm log này
        console.log("⭐ Stats:", stats); // Thêm log này
        // Set reviews data
        setReviews(reviews);

        setReviewStats({
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          ratingDistribution: stats.ratingDistribution,
        });
        console.log('✅ State updated successfully'); 

        // Optional: Set pagination info if you need it
        // setPaginationInfo({
        //     total,
        //     totalPages,
        //     currentPage: page,
        //     limit
        // });
      } catch (err) {
        console.error("Lỗi khi tải đánh giá:", err);
      }
    };

    fetchReviews();
  }, [id, statsRefreshTrigger]);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    // Kiểm tra đăng nhập
    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      navigate("/login", { state: { from: location } });
      return;
    }

    // Kiểm tra size nếu sản phẩm có size
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Vui lòng chọn size");
      return;
    }

    try {
      const result = await dispatch(
        addToCart({
          productId: product._id,
          quantity: quantity,
          size: selectedSize,
        })
      ).unwrap();

      console.log("✅ Đã thêm vào giỏ hàng:", result);

      // Hiển thị thông báo với logic mới
      const distinctItemCount = result.distinctItemCount || result.items.length;
      const totalItems = result.totalItems || 0;
      const isNewProduct = result.isNewProduct;

      if (isNewProduct) {
        toast.success(
          `Đã thêm sản phẩm mới vào giỏ hàng! (${distinctItemCount} loại sản phẩm)`
        );
      } else {
        toast.success(`Đã tăng số lượng sản phẩm! (${totalItems} sản phẩm)`);
      }

      // Auto-refresh cart count để đảm bảo đồng bộ
      // (Cart state đã được update bởi addToCart.fulfilled)
    } catch (error) {
      console.error("❌ Lỗi thêm vào giỏ hàng:", error);
      toast.error(error || "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const handleCODPayment = () => {
    // Kiểm tra đăng nhập
    if (!user) {
      alert("Vui lòng đăng nhập để thanh toán");

      navigate("/login", { state: { from: location } });

      return;
    }

    // Kiểm tra size nếu sản phẩm có size
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Vui lòng chọn size");
      return;
    }

    // Chuyển sang trang thanh toán với thông tin sản phẩm
    navigate("/checkout", {
      state: {
        product: product,
        quantity: quantity,
        size: selectedSize,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || "Sản phẩm không tồn tại"}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const originalPrice = product.price;
  const discountedPrice =
    product.discountPercentage > 0
      ? originalPrice * (1 - product.discountPercentage / 100)
      : originalPrice;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border">
            <img
              src={
                product.images?.[selectedImage] ||
                "https://via.placeholder.com/500x500?text=No+Image"
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-800 flex-1">
                {product.name}
              </h1>
              <FavoriteButton productId={product._id} size="large" />
            </div>
            <div className="flex gap-2 mb-4">
              {product.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {product.category.name}
                </span>
              )}
              {product.brand && (
                <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                  {product.brand.name}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-red-600">
                {discountedPrice.toLocaleString()}₫
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {originalPrice.toLocaleString()}₫
                  </span>
                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                    -{product.discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Product Stats */}
          <ProductStats
            productId={product._id}
            refreshTrigger={statsRefreshTrigger}
          />

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {product.description}
            </p>

            {/* Brand Info */}
            {product.brand && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span>Thương hiệu:</span>
                  <span className="text-purple-600">{product.brand.name}</span>
                  {product.brand.country && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {product.brand.country}
                    </span>
                  )}
                </h4>
                {product.brand.description && (
                  <p className="text-sm text-gray-600">
                    {product.brand.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          {product.stock > 0 ? (
            <div className="space-y-4">
              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="font-medium block mb-2">
                    Chọn size: {selectedSize && <span className="text-blue-600">({selectedSize})</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => {
                      const variant = product.variants?.find(v => v.size === size);
                      const isOutOfStock = variant && variant.stock === 0;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                            selectedSize === size
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {size}
                          {variant && variant.stock > 0 && variant.stock <= 5 && (
                            <span className="text-xs text-red-500 ml-1">({variant.stock})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="font-medium">Số lượng:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    min="1"
                    max={product.stock}
                    className="w-16 text-center border-x border-gray-300 py-2"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>

              <button
                onClick={handleCODPayment}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Thanh toán COD ngay
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-red-600 font-semibold">Sản phẩm đã hết hàng</p>
            </div>
          )}

          {/* Quay lại */}
          <button
            onClick={() => navigate(-1)}
            className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12" id="reviews">
        <ReviewSection
          productId={product._id}
          autoOpenReview={searchParams.get("review") === "true"}
          orderId={searchParams.get("orderId")}
          onReviewChange={() => setStatsRefreshTrigger((prev) => prev + 1)}
        />
      </div>

      {/* Similar Products */}
      <div className="mt-12">
        <SimilarProducts productId={product._id} />
      </div>
    </div>
  );
}
