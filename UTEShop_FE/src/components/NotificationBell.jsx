import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNotificationsAsync,
  markNotificationsAsReadAsync,
} from "../redux/notificationSlice";
import { Link } from "react-router-dom";
import api from "@/api/axiosConfig";

export function NotificationBell() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [orderPreview, setOrderPreview] = useState(null);

  // Tải thông báo lần đầu khi component được mount
  useEffect(() => {
    dispatch(fetchNotificationsAsync());
  }, [dispatch]);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    // Nếu có thông báo chưa đọc, đánh dấu là đã đọc khi mở dropdown
    if (unreadCount > 0) {
      dispatch(markNotificationsAsReadAsync());
    }
  };

  const openNotif = async (notif) => {
    setSelectedNotif(notif);
    setOrderPreview(null);
    setIsDropdownOpen(false);
    // Nếu có orderId, lấy nhanh thông tin sản phẩm trong đơn
    const orderId = notif?.meta?.orderId || notif?.orderId;
    if (orderId) {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrderPreview({
          _id: data._id,
          items: data.items || [],
          totalPrice: data.totalPrice,
          createdAt: data.createdAt,
        });
      } catch (e) {
        // ignore preview failure
      }
    }
  };

  const closeModal = () => {
    setSelectedNotif(null);
    setOrderPreview(null);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-gray-100 relative"
        onClick={handleBellClick}
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {unreadCount}
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
                <div className="text-sm font-medium mb-2">Đơn hàng #{orderPreview._id}</div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
