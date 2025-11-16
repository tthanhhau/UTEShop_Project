import * as React from "react";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  ShoppingBag,
  LogOut,
  ShoppingBasket,
  Heart,
  Bell,
  ReceiptJapaneseYen,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "../../features/auth/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useCartNotifications } from "../../hooks/useCartNotifications";
import { getCartItemCount } from "../../features/cart/cartSlice";
import { NotificationBell } from "../NotificationBell";
import api from "@/api/axiosConfig";
import { searchByImage } from "@/api/imageSearchApi";
const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { badgeCount } = useCartNotifications(); // Lấy badge count từ custom hook
  const [searchTerm, setSearchTerm] = React.useState("");
  const [userP, setUserP] = React.useState(null);
  const [isImageSearchLoading, setIsImageSearchLoading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Lấy số lượng giỏ hàng khi user đăng nhập hoặc giỏ hàng thay đổi
  useEffect(() => {
    if (user) {
      dispatch(getCartItemCount());
    }
  }, [user]);

  // Bỏ auto-navigate để tránh điều hướng bất ngờ khi người dùng chỉ mới nhập

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }

    try {
      setIsImageSearchLoading(true);
      // Chỉ lấy 1 sản phẩm phù hợp nhất
      const response = await searchByImage(file, 1);
      
      if (response.success && response.data && response.data.length > 0) {
        // Lấy sản phẩm đầu tiên (có similarity cao nhất)
        const topProduct = response.data[0];
        
        // Kiểm tra similarity score - nếu quá thấp thì cảnh báo
        if (topProduct.similarity < 0.5) {
          const confirm = window.confirm(
            `Độ tương đồng thấp (${(topProduct.similarity * 100).toFixed(1)}%). ` +
            `Bạn có muốn xem sản phẩm này không?`
          );
          if (!confirm) {
            setIsImageSearchLoading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }
        }
        
        // Navigate to products page with image search results
        navigate('/products', {
          state: {
            imageSearchResults: response.data,
            isImageSearch: true
          }
        });
      } else {
        alert('Không tìm thấy sản phẩm tương tự. Vui lòng thử lại với hình ảnh khác.');
      }
    } catch (error) {
      console.error('Image search error:', error);
      alert('Lỗi khi tìm kiếm hình ảnh. Vui lòng thử lại sau.');
    } finally {
      setIsImageSearchLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoClick = () => navigate("/");
  const handleShopClick = () => navigate("/products");
  const handleBrandsClick = () => navigate("/products"); // hoặc /brands nếu có
  const handleProfileClick = () => navigate("/profile");
  const handleMyOrdersClick = () => navigate("/orders-tracking");
  const handlePurchaseHistoryClick = () => navigate("/purchase-history");
  const handleFavoritesClick = () => navigate("/favorites");
  const handleVoucherClick = () => navigate("/vouchers");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={handleLogoClick}
          className="flex-shrink-0 cursor-pointer select-none"
        >
          <h1 className="text-2xl font-bold text-black hover:text-blue-600 transition-colors">
            UTE SHOP
          </h1>
        </div>

        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <span
            onClick={handleShopClick}
            className="text-gray-700 hover:text-blue-600 cursor-pointer transition-colors font-medium"
          >
            Shop
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <form className="relative" onSubmit={handleSearch}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleSearch}
            />
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10 pr-12 py-2 w-full bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSearch}
              className="hidden"
            />
            <Camera
              className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors ${isImageSearchLoading ? 'animate-pulse' : ''}`}
              onClick={handleCameraClick}
              title="Tìm kiếm bằng hình ảnh"
            />
          </form>
        </div>

        {/* Right Icons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Cart Icon with Badge */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 relative"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {user && badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Button>

          {/* Favorites Icon */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
              onClick={handleFavoritesClick}
            >
              <Heart className="h-5 w-5 text-gray-700" />
            </Button>
          )}
          {/* Notifications Icon */}
          {user && <NotificationBell />}

          {/* User / Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 px-2"
                >
                  <User className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-700 font-medium hidden sm:inline">
                    {user.name || user.email.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Trang cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMyOrdersClick}>
                  <ShoppingBasket className="mr-2 h-4 w-4" />
                  <span>Đơn hàng</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleVoucherClick}>
                  <ReceiptJapaneseYen className="mr-2 h-4 w-4" />
                  <span>Thẻ giảm giá</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePurchaseHistoryClick}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Lịch sử mua</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="hover:bg-gray-100"
              onClick={() => navigate("/login")}
            >
              <User className="h-5 w-5 text-gray-700 mr-1" />
              <span className="text-gray-700 font-medium">Login</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation & Search */}
      <div className="md:hidden mt-3">
        {/* Mobile Navigation Links */}
        <div className="flex items-center justify-center space-x-4 mb-3 pb-2 border-b border-gray-100">
          <span
            onClick={handleShopClick}
            className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer transition-colors font-medium"
          >
            Shop
          </span>
        </div>

        {/* Mobile Search Bar */}
        <form className="relative" onSubmit={handleSearch}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleSearch}
          />
          <Input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10 pr-12 py-2 w-full bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <Camera
            className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors ${isImageSearchLoading ? 'animate-pulse' : ''}`}
            onClick={handleCameraClick}
            title="Tìm kiếm bằng hình ảnh"
          />
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
