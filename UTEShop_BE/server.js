// server.js
import "dotenv/config"; // nạp .env sớm nhất
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { initializeAgenda } from "./src/config/agenda.js";
import http from 'http'; 
import { initializeSocket, sendNotificationToUser } from './src/config/socket.js'; // Import từ file socket

// Modules của bạn
import connectDB from "./src/config/db.js";
import rateLimiter from "./src/middlewares/rateLimiter.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

// tạo 4 khoi hien thi san pham
import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import brandRoutes from "./src/routes/brandRoutes.js";
import cartRoutes from './src/routes/cartRoutes.js';

import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";

// Import routes mới
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import viewedProductRoutes from "./src/routes/viewedProductRoutes.js";
import similarProductRoutes from "./src/routes/similarProductRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";

const app = express();
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
const io = initializeSocket(httpServer);

const agenda = initializeAgenda(io, sendNotificationToUser);

// Gán `io` và `sendNotificationToUser` vào `app.locals` để các controller có thể truy cập
app.locals.io = io;
app.locals.sendNotificationToUser = sendNotificationToUser;
app.locals.agenda = agenda;

/* ----------------------------- Middlewares ------------------------------ */

// CORS: hỗ trợ 1 hoặc nhiều origin, cách nhau dấu phẩy trong FRONTEND_URL
const origins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: false, // nếu dùng cookie/session hãy chuyển true và cấu hình lại
  })
);

app.use(morgan("dev"));

// parse JSON (giới hạn để tránh payload quá lớn)
app.use(express.json({ limit: "200kb" }));

/* -------------------------------- Routes -------------------------------- */

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.send("UTEShop API running..."));

app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/user", userRoutes);

// thêm 4 khối sản phẩm trang chủ
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);

app.use('/api/cart', cartRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// Routes mới
app.use("/api/favorites", favoriteRoutes);
app.use("/api/viewed-products", viewedProductRoutes);
app.use("/api/similar-products", similarProductRoutes);
app.use("/api/reviews", reviewRoutes);

// Admin routes
import voucherRoutes from "./src/routes/voucherRoutes.js";
import pointsRoutes from "./src/routes/pointsRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import adminCategoryRoutes from "./src/routes/adminCategoryRoutes.js";
import adminProductRoutes from "./src/routes/adminProductRoutes.js";
import adminBrandRoutes from "./src/routes/adminBrandRoutes.js";

app.use("/api/admin/vouchers", voucherRoutes);
app.use("/api/admin/points", pointsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/brands", adminBrandRoutes);

// Customer voucher and points routes
app.use("/api/vouchers", voucherRoutes);
app.use("/api/points", pointsRoutes);


/* ------------------------------- 404 & Err ------------------------------ */

// 404 JSON thay vì HTML
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler cuối cùng
app.use((err, req, res, next) => {
  // Nếu là lỗi CORS ở trên, trả 403 thay vì 500
  const isCors = err?.message === "Not allowed by CORS";
  const status = isCors ? 403 : err.status || 500;
  const msg = isCors ? "CORS blocked" : err.message || "Internal Server Error";
  if (status >= 500) console.error(err); // log lỗi server
  res.status(status).json({ message: msg });
});

/* ------------------------------- Bootstrap ------------------------------ */

const PORT = Number(process.env.PORT) || 5000;

const serverStart = async () => {
  try {
    await connectDB(); // chỉ start server sau khi DB OK
    
    // Start agenda với error handling
    try {
      await agenda.start();
      console.log("✅ Agenda started successfully.");
    } catch (agendaError) {
      console.warn("⚠️  Agenda failed to start, but server will continue:", agendaError.message);
      // Server vẫn tiếp tục chạy ngay cả khi Agenda lỗi
    }
    
    httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (e) {
    console.error("❌ Failed to start server:", e);
    process.exit(1);
  }
};

serverStart();

/* --------------------------- Graceful Shutdown -------------------------- */
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

export default app; // tiện cho test/e2e
