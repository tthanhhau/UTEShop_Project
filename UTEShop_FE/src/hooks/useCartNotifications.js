import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchCart } from '../features/cart/cartSlice';

export const useCartNotifications = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [badgeCount, setBadgeCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Đếm số lượng sản phẩm khác nhau
    if (user) {
      const distinctProductCount = new Set(items.map(item => item.product._id)).size;
      setBadgeCount(distinctProductCount);
    }
  }, [items, user]);

  // Separate useEffect để tránh vòng lặp vô hạn
  useEffect(() => {
    // Chỉ fetch cart một lần khi user đăng nhập và chưa khởi tạo
    if (user && !hasInitialized && !loading) {
      console.log('🛒 Initializing cart for user:', user.id);
      dispatch(fetchCart());
      setHasInitialized(true);
    }
    
    // Reset khi user logout
    if (!user) {
      setHasInitialized(false);
    }
  }, [user, hasInitialized, loading, dispatch]);

  return {
    badgeCount, // Số lượng sản phẩm khác nhau trong giỏ hàng
    hasItems: items.length > 0, // Hiển thị badge khi có sản phẩm trong giỏ
  };
};