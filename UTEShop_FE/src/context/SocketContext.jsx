import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';

import { toast } from 'react-toastify'; // Thư viện hiển thị pop-up
import 'react-toastify/dist/ReactToastify.css'; // CSS cho toast
import { addNotification } from '../redux/notificationSlice'; // Action từ Redux slice
import { selectCurrentToken } from '../features/auth/authSlice';

// Tạo Context
const SocketContext = createContext(null);

// Hook tùy chỉnh để dễ dàng sử dụng
export const useSocket = () => {
    return useContext(SocketContext);
};

// Component Provider để bao bọc ứng dụng
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const dispatch = useDispatch();
    
    // 2. Lấy token từ Redux store làm nguồn chân lý duy nhất
    const token = useSelector(selectCurrentToken);

    useEffect(() => {
        // Chỉ thực hiện kết nối WebSocket NẾU người dùng đã đăng nhập (có token)
        if (token) {
            // 3. Khởi tạo kết nối đến server WebSocket
            // Truyền token vào phần `auth` để middleware ở backend có thể xác thực
            const newSocket = io("http://localhost:5000", {
                auth: {
                    token: token
                }
            });

            console.log("Attempting to connect to WebSocket server...");
            setSocket(newSocket);

            // 4. Lắng nghe các sự kiện từ server
            newSocket.on('connect', () => {
                console.log('✅ WebSocket connected successfully! Socket ID:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ WebSocket connection error:', err.message);
            });

            // --- ĐÂY LÀ LISTENER QUAN TRỌNG NHẤT ---
            // Lắng nghe sự kiện 'new_notification' mà backend gửi
            newSocket.on('new_notification', (notificationData) => {
                console.log('📬 Received new notification:', notificationData);
                
                // Hiển thị một pop-up thông báo đẹp mắt cho người dùng
                // Nếu là delivery confirmation, hiển thị với style đặc biệt
                if (notificationData.type === 'order_delivery_confirmation') {
                    toast.warning(notificationData.message, {
                        autoClose: 10000, // Hiển thị lâu hơn (10 giây)
                        onClick: () => {
                            // User có thể click vào toast để xem chi tiết
                        }
                    });
                } else {
                    toast.info(notificationData.message, {
                        onClick: () => {
                            // (Tùy chọn) Điều hướng đến link của thông báo khi người dùng click
                            // Cần có `navigate` từ `useNavigate` nếu muốn dùng tính năng này
                            // navigate(notificationData.link);
                        }
                    });
                }
                
                // Dispatch action `addNotification` để cập nhật Redux store
                // Giúp icon chuông và danh sách thông báo được cập nhật real-time
                dispatch(addNotification(notificationData));
            });


            // 5. Dọn dẹp (cleanup) khi component unmount hoặc khi token thay đổi (logout)
            // Cực kỳ quan trọng để tránh rò rỉ bộ nhớ và các kết nối thừa
            return () => {
                console.log('🔌 Disconnecting WebSocket...');
                newSocket.disconnect();
            };
        } else {
            // Nếu không có token (người dùng đã logout), đảm bảo không có kết nối nào tồn tại
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    // Mảng phụ thuộc: useEffect sẽ chạy lại mỗi khi `token` thay đổi
    // - Khi `token` từ null -> có giá trị (login): Tạo kết nối mới
    // - Khi `token` từ có giá trị -> null (logout): Ngắt kết nối cũ
    }, [token, dispatch]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};