// src/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendMail } from "./mailer.js";

const userSocketMap = new Map();

export const initializeSocket = (httpServer) => {
  // Lấy CORS origin từ environment variable hoặc dùng default cho development
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ["http://localhost:5173"];

  console.log('🔌 Socket.IO CORS origins:', corsOrigins);

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware để xác thực người dùng qua JWT khi họ kết nối
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.userId = decoded.id; // Gắn userId vào object socket
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId}, socketId: ${socket.id}`);

    // Lưu lại kết nối của người dùng
    userSocketMap.set(socket.userId, socket.id);

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      // Xóa người dùng khỏi "sổ danh bạ" khi họ ngắt kết nối
      userSocketMap.delete(socket.userId);
    });
  });

  return io;
};

/**
 * Hàm tiện ích để gửi thông báo đến một người dùng cụ thể
 * @param {string} userId - ID của người dùng cần nhận thông báo
 * @param {string} eventName - Tên của sự kiện (ví dụ: 'order_status_update')
 * @param {object} data - Dữ liệu cần gửi (ví dụ: { orderId, newStatus, message })
 */
export const sendNotificationToUser = async (io, userId, eventName, data) => {
  const socketId = userSocketMap.get(userId.toString());
  if (socketId) {
    console.log(
      `🚀 Sending event '${eventName}' to user ${userId} via socket ${socketId}`
    );
    io.to(socketId).emit(eventName, data);
  } else {
    console.log(`🤷 User ${userId} is not connected.`);
  }

  // Gửi email thông báo nếu có email trong data (non-blocking)
  // Lưu ý: Email notification là optional, nếu fail thì không ảnh hưởng đến WebSocket notification
  (async () => {
    try {
      // Lấy thông tin người dùng để có email
      const user = await User.findById(userId).select("email name");
      if (!user || !user.email) {
        console.log(`📧 Email notification skipped: User ${userId} has no email`);
        return;
      }

      // Kiểm tra xem có cấu hình email không
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`📧 Email notification skipped: Email credentials not configured`);
        return;
      }

      console.log(`📧 Preparing to send email notification to ${user.email}`);
      await sendMail({
        to: user.email,
        subject: `🔔 Thông báo mới từ UTE SHOP`,
        html: `
                  <h1>Xin chào ${user.name},</h1>
                  <p>Bạn có một thông báo mới:</p>
                  <blockquote>${data.message || 'Thông báo mới'}</blockquote>
                  <br><br>
                  <p>Trân trọng,<br>Đội ngũ UTE SHOP</p>
              `,
      });

      console.log(`✅ Email notification sent successfully to ${user.email}`);
    } catch (error) {
      // Chỉ log warning, không throw error để không ảnh hưởng đến WebSocket notification
      console.warn(
        `⚠️ Email notification failed (non-critical) for user ${userId}:`,
        error.message
      );
    }
  })();
};
