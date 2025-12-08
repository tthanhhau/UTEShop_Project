# Sửa lỗi Network Error - Frontend không load được sản phẩm

## Lỗi hiện tại

```
AxiosError: Network Error
at https://uteshop-fe.onrender.com/assets/index-Bt1iMwEH.js
Request: GET https://uteshop-backend.onrender.com/api/products/home-blocks
```

## Nguyên nhân

### 1. Backend đang sleep (Render Free Tier)
- ⏰ Render free tier sleep sau 15 phút không hoạt động
- 🐌 Request đầu tiên mất 30-60 giây để wake up
- ❌ Frontend timeout trước khi backend kịp wake up

### 2. CORS chưa cấu hình đúng
- Backend chưa cho phép frontend production gọi API
- Environment variables chưa set đúng

### 3. Backend chưa deploy hoặc crashed
- Service không chạy
- Build failed

---

## GIẢI PHÁP

### Bước 1: Kiểm tra Backend có chạy không

**Mở trình duyệt, vào:**
```
https://uteshop-backend.onrender.com/
```

**Kết quả:**
- ✅ Trả về response (JSON hoặc "Cannot GET /") → Backend đang chạy
- ⏰ Loading lâu 30-60s → Backend đang wake up từ sleep
- ❌ 404 hoặc "Service not found" → Backend chưa deploy
- ❌ 500 error → Backend crashed

### Bước 2: Cấu hình Environment Variables trên Render

#### Backend (uteshop-backend)

1. Vào Render Dashboard
2. Chọn service **uteshop-backend**
3. Settings → Environment
4. Thêm/Cập nhật:

```env
# Frontend URLs (QUAN TRỌNG!)
FRONTEND_URL=https://uteshop-fe.onrender.com
ADMIN_FRONTEND_URL=https://uteshop-admin.onrender.com

# Hoặc nhiều URLs (phân cách bằng dấu phẩy)
FRONTEND_URL=https://uteshop-fe.onrender.com,http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Port
PORT=5000
NODE_ENV=production
```

5. Nhấn **"Save Changes"**
6. Service sẽ tự động redeploy

#### Frontend (uteshop-fe)

1. Chọn service **uteshop-fe**
2. Settings → Environment
3. Thêm/Cập nhật:

```env
VITE_API_URL=https://uteshop-backend.onrender.com
VITE_API_BASE_URL=https://uteshop-backend.onrender.com/api
VITE_FACEBOOK_APP_ID=1210517110969734
VITE_HTTPS=true
```

4. Nhấn **"Save Changes"**
5. Manual Deploy → Deploy latest commit

### Bước 3: Tăng Timeout cho Axios (Frontend)

Backend free tier cần thời gian wake up, tăng timeout:

#### File: `UTEShop_FE/src/api/axiosConfig.js`

Tìm và sửa:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000, // ← Tăng từ 10000 lên 60000 (60 giây)
  headers: {
    'Content-Type': 'application/json',
  },
});
```

Hoặc nếu không có file này, tìm nơi tạo axios instance và thêm `timeout: 60000`.

### Bước 4: Thêm Loading State cho Cold Start

Thêm thông báo cho user khi backend đang wake up:

#### File: `UTEShop_FE/src/pages/HomePage.jsx` (hoặc tương tự)

```javascript
const [isWakingUp, setIsWakingUp] = useState(false);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      setIsWakingUp(true);
      const response = await axios.get('/products/home-blocks');
      setProducts(response.data);
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        // Backend đang wake up, retry sau 5s
        setTimeout(fetchProducts, 5000);
      }
    } finally {
      setIsWakingUp(false);
    }
  };

  fetchProducts();
}, []);

// Trong JSX
{isWakingUp && (
  <div className="text-center py-8">
    <p>Đang tải dữ liệu... (Backend đang khởi động, vui lòng đợi)</p>
  </div>
)}
```

### Bước 5: Keep Backend Awake (Optional)

Để tránh backend sleep, có thể:

#### Cách 1: Ping Service định kỳ

Tạo cron job ping backend mỗi 10 phút:
- Dùng cron-job.org
- Dùng UptimeRobot
- Dùng GitHub Actions

**UptimeRobot (Free):**
1. Đăng ký tại https://uptimerobot.com/
2. Add New Monitor
3. Monitor Type: HTTP(s)
4. URL: `https://uteshop-backend.onrender.com/`
5. Monitoring Interval: 5 minutes
6. Save

#### Cách 2: Nâng cấp Render Plan

Render Starter plan ($7/month):
- ✅ Không sleep
- ✅ Faster
- ✅ More resources

---

## Kiểm tra sau khi sửa

### 1. Test Backend trực tiếp

```bash
# Test health endpoint
curl https://uteshop-backend.onrender.com/

# Test API endpoint
curl https://uteshop-backend.onrender.com/api/products/home-blocks
```

Phải trả về JSON data, không phải CORS error.

### 2. Test từ Frontend

1. Mở https://uteshop-fe.onrender.com/
2. Mở DevTools (F12) → Console
3. Không có lỗi CORS
4. Sản phẩm hiển thị

### 3. Check CORS Headers

Mở DevTools → Network tab → Chọn request → Headers:

**Response Headers phải có:**
```
Access-Control-Allow-Origin: https://uteshop-fe.onrender.com
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trong backend environment variables
2. Phải match chính xác với frontend URL
3. Không có trailing slash: `https://uteshop-fe.onrender.com` (không phải `.../`)

### Lỗi: Backend trả về 502 Bad Gateway

**Giải pháp:**
1. Backend crashed hoặc không start được
2. Check logs: Render Dashboard → Service → Logs
3. Kiểm tra MongoDB connection string
4. Kiểm tra environment variables

### Lỗi: Request timeout sau 60s

**Giải pháp:**
1. Backend đang sleep, đợi wake up
2. Refresh lại trang sau 1 phút
3. Hoặc setup UptimeRobot để keep awake

### Frontend vẫn gọi localhost

**Giải pháp:**
1. Kiểm tra `.env` có đúng không
2. Rebuild frontend: Manual Deploy
3. Clear browser cache (Ctrl+Shift+R)

---

## Checklist

### Backend
- [ ] Service đang chạy (không crashed)
- [ ] Environment variables đã set đúng
- [ ] `FRONTEND_URL` match với frontend URL
- [ ] CORS config đúng
- [ ] MongoDB connected
- [ ] Logs không có error

### Frontend
- [ ] `VITE_API_URL` đúng backend URL
- [ ] Rebuild sau khi thay đổi env
- [ ] Axios timeout đủ lớn (60s)
- [ ] Browser cache cleared

### Network
- [ ] Backend response có CORS headers
- [ ] No CORS errors trong console
- [ ] API calls thành công
- [ ] Data hiển thị đúng

---

## Lưu ý quan trọng

### Render Free Tier Limitations

1. **Sleep after 15 minutes**
   - First request: 30-60s wake up time
   - Solution: UptimeRobot hoặc upgrade plan

2. **750 hours/month limit**
   - Đủ cho 1 service chạy 24/7
   - Nhiều services → cần tính toán

3. **Slow cold starts**
   - Normal behavior
   - Tăng timeout để handle

### Production Recommendations

1. **Nâng cấp plan** nếu:
   - Cần uptime 24/7
   - Không chấp nhận cold start
   - Có traffic thực sự

2. **Optimize**:
   - Cache data khi có thể
   - Lazy load components
   - Show loading states

3. **Monitor**:
   - Setup UptimeRobot
   - Check logs thường xuyên
   - Monitor error rates

---

## Tóm tắt

**Vấn đề chính**: Backend sleep + CORS chưa config

**Giải pháp nhanh**:
1. Set `FRONTEND_URL` trong backend env
2. Tăng axios timeout lên 60s
3. Setup UptimeRobot để keep awake
4. Đợi backend wake up (30-60s) lần đầu

**Giải pháp lâu dài**:
- Nâng cấp Render plan ($7/month)
- Hoặc chấp nhận cold start và optimize UX

Done! 🎉
