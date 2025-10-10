import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNotificationsAsync,
  markNotificationsAsReadAsync,
} from "../redux/notificationSlice";
import { Link } from "react-router-dom";

export function NotificationBell() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                  <Link
                    to={notif.link || "#"}
                    className={`block p-3 hover:bg-gray-50 ${
                      !notif.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </Link>
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
    </div>
  );
}
