import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Store, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';


const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { items, totalItems, totalAmount, loading, error } = useSelector((state) => state.cart);

  // State để quản lý các sản phẩm được chọn
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // State cho tìm kiếm sản phẩm trong giỏ hàng
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  // Debug log để kiểm tra items
  useEffect(() => {
    if (items && items.length > 0) {
      console.log('🛒 CartPage - Items:', items.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        size: item.size,
        quantity: item.quantity
      })));
    }
  }, [items]);

  // Loại bỏ việc tự động chọn tất cả sản phẩm khi load giỏ hàng
  useEffect(() => {
    if (items && items.length > 0) {
      // Chỉ reset nếu selectedItems rỗng
      if (selectedItems.size === 0) {
        setSelectAll(false);
      }
    }
  }, [items]);

  const handleQuantityChange = (productId, newQuantity, size) => {
    if (newQuantity < 1) return;

    // Nếu sản phẩm đã được chọn, giữ nguyên trạng thái chọn
    dispatch(updateCartItem({ productId, quantity: newQuantity, size }));
  };

  const handleRemoveItem = (item) => {
    // Xóa khỏi selected items khi xóa sản phẩm
    const itemKey = getItemKey(item);
    const newSelected = new Set(selectedItems);
    newSelected.delete(itemKey);
    setSelectedItems(newSelected);
    dispatch(removeFromCart({ productId: item.product._id, size: item.size }));
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      setSelectedItems(new Set());
      setSelectAll(false);
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    // Lấy thông tin các sản phẩm được chọn (sử dụng getItemKey)
    const selectedProducts = items.filter(item => selectedItems.has(getItemKey(item)));

    // Chuyển đến trang checkout với thông tin sản phẩm từ giỏ hàng
    navigate('/checkout', {
      state: {
        cartItems: selectedProducts,
        fromCart: true
      }
    });
  };


  // Xử lý chọn/bỏ chọn sản phẩm (sử dụng unique key bao gồm cả size)
  const getItemKey = (item) => `${item.product._id}-${item.size || 'no-size'}`;

  const handleSelectItem = (item, checked) => {
    const itemKey = getItemKey(item);
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemKey);
    } else {
      newSelected.delete(itemKey);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === items.length);
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (checked) => {
    if (checked) {
      const allItemKeys = new Set(items.map(item => getItemKey(item)));
      setSelectedItems(allItemKeys);
    } else {
      setSelectedItems(new Set());
    }
    setSelectAll(checked);
  };

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredItems = (Array.isArray(items) ? items : []).filter(
    (item) => {
      const term = (searchTerm || "").toString().toLowerCase();
      const productName = (item?.product?.name || "").toString().toLowerCase();
      const size = (item?.size || "").toString().toLowerCase();

      return productName.includes(term) || size.includes(term);
    }
  );

  // Tính toán cho các sản phẩm được chọn
  const selectedItemsData = items.filter(item => selectedItems.has(getItemKey(item)));
  const selectedTotalItems = selectedItemsData.reduce((total, item) => total + item.quantity, 0);
  const selectedTotalAmount = selectedItemsData.reduce((total, item) => {
    const itemPrice = item.product.price * item.quantity;
    const discountAmount = item.product.discountPercentage > 0
      ? itemPrice * item.product.discountPercentage / 100
      : 0;
    return total + (itemPrice - discountAmount);
  }, 0);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập để xem giỏ hàng</h2>
        <Button onClick={() => navigate('/login', { state: { from: location } })}>
          Đăng nhập
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 mb-4">Lỗi: {error}</p>
        <Button onClick={() => dispatch(fetchCart())}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-medium">Giỏ Hàng</h1>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <ShoppingBag className="h-20 w-20 mx-auto text-gray-300 mb-6" />
            <h2 className="text-xl font-medium mb-2 text-gray-800">Giỏ hàng của bạn còn trống</h2>
            <p className="text-gray-500 mb-6">Hãy chọn thêm sản phẩm để mua sắm nhé</p>
            <Button
              onClick={() => navigate('/products')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
            >
              Mua Ngay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-sm p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-medium text-gray-800">Giỏ Hàng</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            {/* Cart Header */}
            <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Store className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">UTE Shop</span>
                  <span className="text-sm text-gray-500">({selectedTotalItems} sản phẩm)</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleClearCart}
                  className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Xóa tất cả
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm sản phẩm trong giỏ hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 focus:bg-white transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-500">
                  Tìm thấy {filteredItems.length} sản phẩm phù hợp với "{searchTerm}"
                </div>
              )}
            </div>

            {/* Product List */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-800">
                    {searchTerm ? "Không tìm thấy sản phẩm" : "Giỏ hàng trống"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? "Không có sản phẩm nào trong giỏ hàng phù hợp với từ khóa tìm kiếm của bạn"
                      : "Hãy chọn thêm sản phẩm để mua sắm nhé"
                    }
                  </p>
                  {searchTerm ? (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Xóa tìm kiếm
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/products')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg"
                    >
                      Mua Ngay
                    </Button>
                  )}
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <div
                    key={`${item.product._id}-${item.size || 'no-size'}-${index}`}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-2">
                        <Checkbox
                          checked={selectedItems.has(getItemKey(item))}
                          onCheckedChange={(checked) => handleSelectItem(item, checked)}
                        />
                      </div>

                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images?.[0] || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        {/* Product Name and Size */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-800 line-clamp-2 leading-5 flex-1 pr-2">
                            {item.product.name}
                          </h3>
                          {/* Size Badge */}
                          {item.size && (
                            <span className="flex-shrink-0 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                              Size: {typeof item.size === 'object' ? item.size.size || item.size : item.size}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Price */}
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-semibold">
                              {formatPrice(item.product.discountPercentage > 0
                                ? item.product.price - (item.product.price * item.product.discountPercentage / 100)
                                : item.product.price
                              )}
                            </span>
                            {item.product.discountPercentage > 0 && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.product.price)}
                              </span>
                            )}
                          </div>

                          {/* Quantity & Actions */}
                          <div className="flex items-center gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-300 rounded">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.product._id, item.quantity - 1, item.size)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-30"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-3 py-1 text-center min-w-[2.5rem] text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(item.product._id, item.quantity + 1, item.size)}
                                disabled={item.quantity >= item.product.stock}
                                className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-30"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Total Price */}
                            <div className="text-right min-w-[100px]">
                              <p className="text-blue-600 font-semibold">
                                {formatPrice((item.product.discountPercentage > 0
                                  ? item.product.price - (item.product.price * item.product.discountPercentage / 100)
                                  : item.product.price
                                ) * item.quantity)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item)}
                                className="text-gray-500 hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg p-4 shadow-sm sticky top-4">
              <h3 className="font-medium mb-4 text-gray-800">Tóm tắt đơn hàng</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính ({selectedTotalItems} sản phẩm)</span>
                  <span>{formatPrice(selectedTotalAmount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="text-green-500">Miễn phí</span>
                </div>

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Tổng thanh toán</span>
                  <span className="text-blue-600 text-lg font-semibold">
                    {formatPrice(selectedTotalAmount)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium mb-3"
                onClick={handleCheckout}
                disabled={selectedItems.size === 0}
              >
                Mua Hàng ({selectedTotalItems})
              </Button>

              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg"
                onClick={() => navigate('/products')}
              >
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
