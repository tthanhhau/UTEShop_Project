// src/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendMail } from "./mailer.js";

const userSocketMap = new Map();

export const initializeSocket = (httpServer) => {
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"];

  console.log('🔌 Socket.IO CORS origins:', corsOrigins);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        // Hỗ trợ thêm FRONTEND_URL & ADMIN_FRONTEND_URL từ env
        const extraOrigins = [];
        if (process.env.FRONTEND_URL) {
          extraOrigins.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean));
        }
        if (process.env.ADMIN_FRONTEND_URL) {
          extraOrigins.push(...process.env.ADMIN_FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean));
        }

        const allAllowed = [...corsOrigins, ...extraOrigins];

        if (allAllowed.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
          callback(null, true);
        } else {
          console.warn(`⚠️  Socket.IO CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
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
        // Thử xác thực với secret của Admin nếu token chính thất bại
        jwt.verify(token, "uteshop-admin-secret-key-2024", (err2, decoded2) => {
          if (err2) {
            // Thử tiếp với secret mặc định của NestJS
            jwt.verify(token, "your-secret-key", (err3, decoded3) => {
              if (err3) {
                return next(new Error("Authentication error: Invalid token"));
              }
              socket.userId = decoded3.sub || decoded3.id || decoded3._id;
              next();
            });
          } else {
            socket.userId = decoded2.sub || decoded2.id || decoded2._id;
            next();
          }
        });
      } else {
        socket.userId = decoded.id || decoded._id || decoded.sub; // Gắn userId vào object socket (hỗ trợ cả id/sub)
        next();
      }
    });
  });

  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.userId}, socketId: ${socket.id}`);

    // Lưu lại kết nối của người dùng
    userSocketMap.set(socket.userId, socket.id);
    
    // Khách hàng tham gia room của riêng mình
    socket.join(`user_${socket.userId}`);

    // Kiểm tra xem user có phải admin không để đưa vào room admins
    try {
      const user = await User.findById(socket.userId);
      if (user && user.role === "admin") {
        socket.join("admins");
        console.log(`👑 Admin connected: ${socket.userId} joined admins room`);
      }
    } catch (err) {
      console.error("Socket admin check error:", err);
    }

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
