import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNotificationsAsync,
  markNotificationsAsReadAsync,
} from "../redux/notificationSlice";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/axiosConfig";

export function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);
  const dropdownRef = useRef(null);

  // Tải thông báo lần đầu khi component được mount
  useEffect(() => {
    dispatch(fetchNotificationsAsync());
  }, [dispatch]);

  // Click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Không mark as read khi mở dropdown
    // Chỉ mark as read khi user click "Chi tiết"
  };

  const openNotif = async (notif) => {
    console.log('Opening notification:', notif); // Debug
    setSelectedNotif(notif);
    setOrderPreview(null);
    setIsDropdownOpen(false);
    
    // Extract orderId từ nhiều nguồn (notification mới/cũ)
    let orderId = notif?.orderId || notif?.meta?.orderId;
    
    // Nếu không có orderId trực tiếp, thử extract từ message hoặc link
    if (!orderId) {
      const messageMatch = notif?.message?.match(/#([a-f0-9]{24})/i);
      if (messageMatch) orderId = messageMatch[1];
      else {
        const linkMatch = notif?.link?.match(/\/orders\/tracking\/([a-f0-9]{24})/i);
        if (linkMatch) orderId = linkMatch[1];
      }
    }
    
    console.log('Extracted orderId:', orderId); // Debug
    
    if (orderId) {
      try {
        const response = await api.get(`/orders/${orderId}`);
        console.log('Order API response:', response.data); // Debug
        
        // API có thể trả về data.order hoặc data trực tiếp
        const orderData = response.data.order || response.data;
        
        setOrderPreview({
          _id: orderData._id || orderId,
          items: orderData.items || [],
          totalPrice: orderData.totalPrice,
          createdAt: orderData.createdAt,
        });
      } catch (e) {
        console.error('Failed to fetch order preview:', e);
        // Vẫn set orderId để có thể navigate
        setOrderPreview({
          _id: orderId,
          items: [],
          totalPrice: 0,
          createdAt: null,
        });
      }
    }
  };

  const closeModal = () => {
    setSelectedNotif(null);
    setOrderPreview(null);
  };

  const extractOrderIdFromNotification = (notif) => {
    // 1. Thử lấy orderId trực tiếp (notification mới)
    if (notif?.orderId) return notif.orderId;
    if (notif?.meta?.orderId) return notif.meta.orderId;
    
    // 2. Thử extract từ message: "Đơn hàng #690xxxxx của bạn..."
    const messageMatch = notif?.message?.match(/#([a-f0-9]{24})/i);
    if (messageMatch) return messageMatch[1];
    
    // 3. Thử extract từ link: "/orders/tracking/690xxxxx"
    const linkMatch = notif?.link?.match(/\/orders\/tracking\/([a-f0-9]{24})/i);
    if (linkMatch) return linkMatch[1];
    
    // 4. Thử từ orderPreview
    if (orderPreview?._id) return orderPreview._id;
    
    return null;
  };

  const handleViewOrderDetail = () => {
    const orderId = extractOrderIdFromNotification(selectedNotif);
    
    console.log('🔍 Full notification object:', selectedNotif);
    console.log('🔍 OrderPreview:', orderPreview);
    console.log('🔍 Extracted orderId:', orderId);
    
    // Đánh dấu thông báo là đã đọc khi click "Chi tiết"
    dispatch(markNotificationsAsReadAsync());
    
    closeModal();
    
    if (orderId) {
      // Navigate đến trang order tracking với orderId để highlight
      console.log('🔍 Will navigate to: /orders-tracking?highlight=' + orderId);
      navigate(`/orders-tracking?highlight=${orderId}`);
    } else {
      // Nếu không có orderId, vẫn đến trang tracking
      navigate('/orders-tracking');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-gray-100 relative"
        onClick={handleBellClick}
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown List */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-10">
          <div className="p-3 font-semibold border-b">Thông báo</div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length > 0 ? (
              items.map((notif) => (
                <li key={notif._id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => openNotif(notif)}
                    className={`w-full text-left p-3 hover:bg-gray-50 ${!notif.read ? "bg-blue-50" : ""}`}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </button>
                </li>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">
                Bạn không có thông báo nào.
              </p>
            )}
          </ul>
        </div>
      )}

      {/* Modal Popup */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border p-5 m-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">Chi tiết thông báo</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <p className="text-sm mb-2">{selectedNotif.message}</p>
            <p className="text-xs text-gray-500 mb-4">{new Date(selectedNotif.createdAt).toLocaleString("vi-VN")}</p>

            {orderPreview && (
              <div className="rounded-lg border p-3 mb-3">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orderPreview.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={it.product?.images?.[0] || "/placeholder.svg"} alt={it.product?.name || it.name} className="w-10 h-10 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{it.product?.name || it.name}</div>
                        <div className="text-xs text-gray-500">SL: {it.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>Đóng</Button>
              <Button onClick={handleViewOrderDetail} className="bg-primary text-white hover:bg-primary/90">
                Chi tiết
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
