# Hướng dẫn Deploy UTEShop lên Render

## Tổng quan dự án

Dự án UTEShop gồm 4 phần:
1. **UTEShop_BE** - Backend API (Node.js/Express)
2. **UTEShop_BE_Admin** - Backend Admin API (NestJS)
3. **UTEShop_FE** - Frontend User (React/Vite)
4. **UTEShop_FE_Admin** - Frontend Admin (Next.js)

## Yêu cầu trước khi deploy

- ✅ Tài khoản GitHub
- ✅ Tài khoản Render (https://render.com)
- ✅ MongoDB Atlas (database cloud)
- ✅ Cloudinary (image storage)
- ✅ Code đã push lên GitHub

---

## PHẦN 1: Deploy Backend API (UTEShop_BE)

### Bước 1: Tạo Web Service

1. Đăng nhập Render → Dashboard
2. Nhấn **"New +"** → **"Web Service"**
3. Connect GitHub repository: `tthanhhau/UTEShop_Project`
4. Cấu hình:

```
Name: uteshop-backend
Region: Singapore (hoặc gần nhất)
Branch: main
Root Directory: UTEShop_BE
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### Bước 2: Environment Variables

Thêm các biến môi trường (Settings → Environment):

```env
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# CORS
FRONTEND_URL=https://uteshop-frontend.onrender.com
ADMIN_FRONTEND_URL=https://uteshop-admin.onrender.com

# Elasticsearch (optional)
ELASTICSEARCH_NODE=http://localhost:9200
```

### Bước 3: Deploy

1. Nhấn **"Create Web Service"**
2. Chờ deploy (5-10 phút)
3. Copy URL: `https://uteshop-backend.onrender.com`

---

## PHẦN 2: Deploy Backend Admin (UTEShop_BE_Admin)

### Bước 1: Tạo Web Service

```
Name: uteshop-backend-admin
Region: Singapore
Branch: main
Root Directory: UTEShop_BE_Admin
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
Instance Type: Free
```

### Bước 2: Environment Variables

```env
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop

# JWT (dùng chung với BE)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
FRONTEND_URL=https://uteshop-admin.onrender.com

# Elasticsearch (optional)
ELASTICSEARCH_NODE=http://localhost:9200
```

### Bước 3: Deploy

1. Nhấn **"Create Web Service"**
2. Copy URL: `https://uteshop-backend-admin.onrender.com`

---

## PHẦN 3: Deploy Frontend User (UTEShop_FE)

### Bước 1: Tạo Static Site

1. Render Dashboard → **"New +"** → **"Static Site"**
2. Connect repository
3. Cấu hình:

```
Name: uteshop-frontend
Branch: main
Root Directory: UTEShop_FE
Build Command: npm install && npm run build
Publish Directory: dist
```

### Bước 2: Environment Variables

```env
VITE_API_URL=https://uteshop-backend.onrender.com
VITE_API_BASE_URL=https://uteshop-backend.onrender.com/api
VITE_FACEBOOK_APP_ID=1210517110969734
VITE_HTTPS=true
```

### Bước 3: Deploy

1. Nhấn **"Create Static Site"**
2. Copy URL: `https://uteshop-frontend.onrender.com`

---

## PHẦN 4: Deploy Frontend Admin (UTEShop_FE_Admin)

### Bước 1: Tạo Web Service (KHÔNG phải Static Site)

**⚠️ QUAN TRỌNG**: Next.js cần Web Service, không phải Static Site!

```
Name: uteshop-admin
Region: Singapore
Branch: main
Root Directory: UTEShop_FE_Admin
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### Bước 2: Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://uteshop-backend-admin.onrender.com
```

### Bước 3: Deploy

1. Nhấn **"Create Web Service"**
2. Copy URL: `https://uteshop-admin.onrender.com`

---

## PHẦN 5: Cập nhật CORS trong Backend

Sau khi có URL của frontend, cập nhật CORS:

### File: `UTEShop_BE/server.js`

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://uteshop-frontend.onrender.com',  // ← Thêm URL frontend
    'https://uteshop-admin.onrender.com'      // ← Thêm URL admin
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### File: `UTEShop_BE_Admin/src/main.ts`

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://uteshop-admin.onrender.com'  // ← Thêm URL admin
  ],
  credentials: true,
});
```

Commit và push để Render tự động redeploy.

---

## PHẦN 6: Cập nhật Facebook App Settings

1. Vào https://developers.facebook.com/apps/
2. Chọn app của bạn
3. **Facebook Login** → **Settings**
4. Thêm vào **Valid OAuth Redirect URIs**:
   ```
   https://uteshop-frontend.onrender.com/
   https://uteshop-frontend.onrender.com/login
   ```
5. Thêm vào **Allowed Domains**:
   ```
   uteshop-frontend.onrender.com
   ```

---

## Troubleshooting

### 1. "Publish directory build does not exist"

**Nguyên nhân**: Next.js build output là `.next` không phải `build`

**Giải pháp**: 
- Dùng **Web Service** thay vì Static Site
- Start Command: `npm start` (Next.js tự serve từ `.next`)

### 2. "Module not found" errors

**Giải pháp**: Kiểm tra `package.json` có đầy đủ dependencies

```bash
npm install
npm run build  # Test local trước
```

### 3. Backend không kết nối được MongoDB

**Giải pháp**: 
- Kiểm tra MongoDB Atlas Network Access
- Thêm `0.0.0.0/0` (Allow from anywhere)
- Hoặc thêm IP của Render

### 4. CORS errors

**Giải pháp**: Cập nhật CORS origins trong backend với URL production

### 5. Environment variables không load

**Giải pháp**: 
- Render: Settings → Environment → Add variables
- Nhấn **"Save Changes"**
- Manual Deploy nếu cần

### 6. Free tier sleep after 15 minutes

**Lưu ý**: Render free tier sẽ sleep sau 15 phút không hoạt động
- Request đầu tiên sẽ mất 30-60s để wake up
- Không phù hợp cho production thực sự
- Nâng cấp lên paid plan nếu cần

---

## Checklist Deploy

### Backend (UTEShop_BE)
- [ ] Web Service created
- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] Cloudinary configured
- [ ] CORS updated with frontend URLs
- [ ] Deploy successful

### Backend Admin (UTEShop_BE_Admin)
- [ ] Web Service created
- [ ] Environment variables configured
- [ ] Build successful
- [ ] CORS updated
- [ ] Deploy successful

### Frontend (UTEShop_FE)
- [ ] Static Site created
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Can access website
- [ ] API calls working

### Frontend Admin (UTEShop_FE_Admin)
- [ ] Web Service created (NOT Static Site)
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Can access admin panel
- [ ] API calls working

### Post-deployment
- [ ] Facebook App URLs updated
- [ ] Test login functionality
- [ ] Test all major features
- [ ] Monitor logs for errors

---

## URLs Tham khảo

- Render Dashboard: https://dashboard.render.com/
- MongoDB Atlas: https://cloud.mongodb.com/
- Cloudinary: https://cloudinary.com/console
- Facebook Developers: https://developers.facebook.com/apps/

---

## Lưu ý quan trọng

1. **Free tier limitations**:
   - Services sleep after 15 minutes
   - 750 hours/month free
   - Slow cold starts

2. **Database**:
   - Dùng MongoDB Atlas (free tier: 512MB)
   - Không dùng local MongoDB

3. **File uploads**:
   - Dùng Cloudinary (free tier: 25GB)
   - Không lưu files trên Render (ephemeral filesystem)

4. **Environment variables**:
   - KHÔNG commit `.env` vào Git
   - Cấu hình trên Render Dashboard

5. **Build time**:
   - Free tier có giới hạn build time
   - Optimize dependencies nếu build quá lâu

---

## Support

Nếu gặp vấn đề:
1. Check Render logs: Service → Logs
2. Check browser console (F12)
3. Check Network tab để xem API calls
4. Verify environment variables
5. Test API endpoints với Postman
