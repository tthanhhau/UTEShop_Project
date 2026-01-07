import * as React from "react";
import {
  Search,
  ShoppingCart,
  User,
  ShoppingBag,
  LogOut,
  ShoppingBasket,
  Heart,
  ReceiptJapaneseYen,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "../../features/auth/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useCallback } from "react";
import { useCartNotifications } from "../../hooks/useCartNotifications";
import { getCartItemCount } from "../../features/cart/cartSlice";
import { NotificationBell } from "../NotificationBell";
import api from "@/api/axiosConfig";
import { searchByImage } from "@/api/imageSearchApi";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { badgeCount } = useCartNotifications();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [isImageSearchLoading, setIsImageSearchLoading] = React.useState(false);
  const fileInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceRef = useRef(null);

  // Clear search khi route thay đổi (trừ trang products với search param)
  useEffect(() => {
    const isProductsSearchPage = location.pathname === '/products' && location.search.includes('search=');
    if (!isProductsSearchPage) {
      setSearchTerm("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (user) {
      dispatch(getCartItemCount());
    }
  }, [user]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Fetch suggestions from Elasticsearch
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const res = await api.get(`/elasticsearch/suggest?q=${encodeURIComponent(query)}&limit=6`);
      if (res.data.success && res.data.data) {
        setSuggestions(res.data.data);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Suggestion error:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    setSearchTerm("");
    navigate(`/products/${product._id}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") handleSearch(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }

    try {
      setIsImageSearchLoading(true);
      const response = await searchByImage(file, 1);
      if (response.success && response.data && response.data.length > 0) {
        const topProduct = response.data[0];
        if (topProduct.similarity < 0.5) {
          const confirm = window.confirm(
            `Độ tương đồng thấp (${(topProduct.similarity * 100).toFixed(1)}%). Bạn có muốn xem sản phẩm này không?`
          );
          if (!confirm) {
            setIsImageSearchLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }
        navigate('/products', { state: { imageSearchResults: response.data, isImageSearch: true } });
      } else {
        alert('Không tìm thấy sản phẩm tương tự.');
      }
    } catch (error) {
      console.error('Image search error:', error);
      if (error.response?.status === 503) {
        alert('Tính năng tìm kiếm bằng hình ảnh AI hiện không khả dụng trên production.');
      } else {
        alert('Lỗi khi tìm kiếm hình ảnh.');
      }
    } finally {
      setIsImageSearchLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => fileInputRef.current?.click();
  const handleLogoClick = () => navigate("/");
  const handleShopClick = () => navigate("/products");
  const handleProfileClick = () => navigate("/profile");
  const handleMyOrdersClick = () => navigate("/orders-tracking");
  const handlePurchaseHistoryClick = () => navigate("/purchase-history");
  const handleFavoritesClick = () => navigate("/favorites");
  const handleVoucherClick = () => navigate("/vouchers");
  const handleLogout = () => { dispatch(logout()); navigate("/"); };


  // Suggestion dropdown component
  const SuggestionDropdown = () => (
    showSuggestions && suggestions.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
        {suggestions.map((product, index) => (
          <div
            key={product._id}
            onMouseDown={(e) => {
              e.preventDefault(); // Ngăn blur input trước khi click
              handleSuggestionClick(product);
            }}
            className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 mr-3">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600">
                  {(product.discountedPrice || product.price)?.toLocaleString()}đ
                </span>
                {product.discountedPrice && product.discountedPrice < product.price && (
                  <span className="text-xs text-gray-400 line-through">{product.price?.toLocaleString()}đ</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            handleSearch(e);
          }}
          className="px-4 py-2 text-center text-sm text-blue-600 hover:bg-blue-50 cursor-pointer border-t"
        >
          Xem tất cả kết quả cho "{searchTerm}"
        </div>
      </div>
    )
  );

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div onClick={handleLogoClick} className="flex-shrink-0 cursor-pointer select-none">
          <h1 className="text-2xl font-bold text-black hover:text-blue-600 transition-colors">UTE SHOP</h1>
        </div>

        {/* Navigation Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <span onClick={handleShopClick} className="text-gray-700 hover:text-blue-600 cursor-pointer transition-colors font-medium">
            Shop
          </span>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="flex-1 max-w-md mx-8 hidden md:block relative" ref={searchContainerRef}>
          <form className="relative" onSubmit={handleSearch}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleSearch}
            />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm && suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-10 pr-12 py-2 w-full bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSearch} className="hidden" />
            <Camera
              className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors ${isImageSearchLoading ? 'animate-pulse' : ''}`}
              onClick={handleCameraClick}
              title="Tìm kiếm bằng hình ảnh"
            />
            {isLoadingSuggestions && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </form>
          <SuggestionDropdown />
        </div>


        {/* Right Icons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 relative" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {user && badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Button>

          {user && (
            <Button variant="ghost" size="icon" className="hover:bg-gray-100" onClick={handleFavoritesClick}>
              <Heart className="h-5 w-5 text-gray-700" />
            </Button>
          )}
          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 px-2">
                  <User className="h-5 w-5 text-gray-700" />
                  <span className="text-gray-700 font-medium hidden sm:inline">{user.name || user.email.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfileClick}><User className="mr-2 h-4 w-4" /><span>Trang cá nhân</span></DropdownMenuItem>
                <DropdownMenuItem onClick={handleMyOrdersClick}><ShoppingBasket className="mr-2 h-4 w-4" /><span>Đơn hàng</span></DropdownMenuItem>
                <DropdownMenuItem onClick={handleVoucherClick}><ReceiptJapaneseYen className="mr-2 h-4 w-4" /><span>Thẻ giảm giá</span></DropdownMenuItem>
                <DropdownMenuItem onClick={handlePurchaseHistoryClick}><ShoppingBag className="mr-2 h-4 w-4" /><span>Lịch sử mua</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600"><LogOut className="mr-2 h-4 w-4" /><span>Đăng xuất</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="hover:bg-gray-100" onClick={() => navigate("/login")}>
              <User className="h-5 w-5 text-gray-700 mr-1" />
              <span className="text-gray-700 font-medium">Login</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation & Search */}
      <div className="md:hidden mt-3">
        <div className="flex items-center justify-center space-x-4 mb-3 pb-2 border-b border-gray-100">
          <span onClick={handleShopClick} className="text-sm text-gray-700 hover:text-blue-600 cursor-pointer transition-colors font-medium">Shop</span>
        </div>
        <div className="relative" ref={searchContainerRef}>
          <form className="relative" onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" onClick={handleSearch} />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm && suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-10 pr-12 py-2 w-full bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <Camera
              className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-600 ${isImageSearchLoading ? 'animate-pulse' : ''}`}
              onClick={handleCameraClick}
            />
          </form>
          <SuggestionDropdown />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
