# Sửa lỗi Deploy Render - UTEShop_FE_Admin

## Lỗi hiện tại

```
==> Publish directory build does not exist!
==> Build failed 😞
```

## Nguyên nhân

Render đang cấu hình sai:
- ❌ Đang dùng **Static Site** (cho Vite/React)
- ❌ Publish Directory: `build`
- ✅ Cần dùng **Web Service** (cho Next.js)
- ✅ Next.js output: `.next` (không phải `build`)

## Giải pháp: Tạo lại service đúng cách

### Bước 1: Xóa service cũ (nếu có)

1. Vào Render Dashboard
2. Chọn service `uteshop-admin` (hoặc tên bạn đặt)
3. Settings → Delete Service

### Bước 2: Tạo Web Service mới

1. Dashboard → **"New +"** → **"Web Service"** (KHÔNG phải Static Site!)
2. Connect repository: `tthanhhau/UTEShop_Project`
3. Cấu hình như sau:

```
┌─────────────────────────────────────────────┐
│ Name: uteshop-admin                         │
│ Region: Singapore                           │
│ Branch: main                                │
│ Root Directory: UTEShop_FE_Admin            │
│ Runtime: Node                               │
│ Build Command: npm install && npm run build │
│ Start Command: npm start                    │
│ Instance Type: Free                         │
└─────────────────────────────────────────────┘
```

**⚠️ QUAN TRỌNG**: 
- Chọn **Web Service**, KHÔNG phải Static Site
- Start Command phải là `npm start` (Next.js server)

### Bước 3: Environment Variables

Settings → Environment → Add:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-admin-url.onrender.com
```

Thay `your-backend-admin-url` bằng URL backend admin thực tế.

### Bước 4: Deploy

1. Nhấn **"Create Web Service"**
2. Chờ build (5-10 phút)
3. ✅ Deploy thành công!

---

## So sánh: Static Site vs Web Service

### Static Site (Cho Vite/React)
```
Build: npm run build
Output: dist/
Serve: Static files (HTML, CSS, JS)
Phù hợp: UTEShop_FE (Vite)
```

### Web Service (Cho Next.js)
```
Build: npm run build
Output: .next/
Serve: Node.js server (npm start)
Phù hợp: UTEShop_FE_Admin (Next.js)
```

---

## Kiểm tra sau khi deploy

### 1. Check Build Logs
```
Settings → Logs → Build Logs
```
Phải thấy:
```
✓ Compiled successfully
✓ Checking validity of types
✓ Generating static pages (16/16)
```

### 2. Check Deploy Logs
```
Settings → Logs → Deploy Logs
```
Phải thấy:
```
==> Your service is live 🎉
```

### 3. Test Website
```
https://uteshop-admin.onrender.com
```
- Phải load được trang login
- Không có lỗi 404
- Console không có lỗi

---

## Nếu vẫn lỗi

### Lỗi: "Application failed to respond"

**Nguyên nhân**: Port không đúng

**Giải pháp**: Thêm environment variable
```env
PORT=10000
```

### Lỗi: "Build exceeded time limit"

**Nguyên nhân**: Build quá lâu (free tier có limit)

**Giải pháp**: 
1. Xóa `node_modules` và build lại local
2. Optimize dependencies
3. Hoặc nâng cấp plan

### Lỗi: API calls failed

**Nguyên nhân**: Backend URL sai hoặc CORS

**Giải pháp**:
1. Kiểm tra `NEXT_PUBLIC_API_URL` đúng chưa
2. Cập nhật CORS trong backend admin:
   ```typescript
   app.enableCors({
     origin: ['https://uteshop-admin.onrender.com'],
     credentials: true,
   });
   ```

---

## Cấu trúc đúng cho toàn bộ dự án

```
UTEShop_Project/
├── UTEShop_BE/              → Web Service (Node.js)
├── UTEShop_BE_Admin/        → Web Service (NestJS)
├── UTEShop_FE/              → Static Site (Vite)
└── UTEShop_FE_Admin/        → Web Service (Next.js) ← Đây!
```

---

## Quick Commands để test local

```bash
# Test build local trước khi deploy
cd UTEShop_FE_Admin
npm install
npm run build
npm start

# Mở browser: http://localhost:3000
```

Nếu build thành công local → Render cũng sẽ thành công!

---

## Tóm tắt

1. ❌ **SAI**: Static Site + Publish Directory: build
2. ✅ **ĐÚNG**: Web Service + Start Command: npm start
3. Next.js cần Node.js server để chạy
4. Output của Next.js là `.next/` không phải `build/`
5. `npm start` sẽ tự động serve từ `.next/`

---

## Checklist

- [ ] Xóa Static Site cũ (nếu có)
- [ ] Tạo Web Service mới
- [ ] Root Directory: `UTEShop_FE_Admin`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Environment variables đã thêm
- [ ] Deploy thành công
- [ ] Website accessible
- [ ] API calls working

Done! 🎉
