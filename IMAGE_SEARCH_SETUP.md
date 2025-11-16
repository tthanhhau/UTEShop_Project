# Hướng dẫn thiết lập Image Search Service

## Tổng quan

Chức năng tìm kiếm bằng hình ảnh sử dụng CLIP model (OpenAI) để tìm các sản phẩm tương tự dựa trên hình ảnh người dùng upload.

## Cấu trúc

- **Python Service**: `UTEShop_BE/image_search_service/` - Service xử lý image embeddings và similarity search
- **Backend API**: `UTEShop_BE/src/controllers/ImageSearchController.js` - API endpoint trong Express
- **Frontend**: Icon camera trong navbar để upload ảnh và tìm kiếm

## Cài đặt

### 1. Cài đặt Python Service

```bash
cd UTEShop_BE/image_search_service
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

Tạo file `.env` trong `UTEShop_BE/image_search_service/`:

**Cho MongoDB Atlas (Cloud - Khuyến nghị):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop?retryWrites=true&w=majority
IMAGE_SEARCH_PORT=5002
```

**Cho MongoDB Local:**
```env
MONGODB_URI=mongodb://localhost:27017/uteshop
IMAGE_SEARCH_PORT=5002
```

**Lưu ý quan trọng cho MongoDB Atlas:**
- Thay `username`, `password`, `cluster` bằng thông tin MongoDB Atlas của bạn
- Đảm bảo connection string có database name (`/uteshop`) ở cuối
- **Whitelist IP**: Vào MongoDB Atlas Dashboard → Network Access → Add IP Address (hoặc Allow Access from Anywhere cho development)
- Connection string phải có format: `mongodb+srv://.../database?retryWrites=true&w=majority`

### 3. Cấu hình Backend

Thêm vào file `.env` của backend Express:

```env
IMAGE_SEARCH_SERVICE_URL=http://localhost:5002
```

### 4. Chạy services

#### Terminal 1: Python Image Search Service
```bash
cd UTEShop_BE/image_search_service
python app.py
```

#### Terminal 2: Express Backend
```bash
cd UTEShop_BE
npm install  # Cài form-data nếu chưa có
npm run dev
```

#### Terminal 3: Frontend
```bash
cd UTEShop_FE
npm start
```

## Sử dụng

1. Người dùng click vào icon camera (📷) trong thanh tìm kiếm
2. Chọn hình ảnh từ thiết bị
3. Hệ thống sẽ:
   - Upload ảnh lên backend
   - Backend gửi ảnh đến Python service
   - Python service encode ảnh và so sánh với embeddings của tất cả sản phẩm
   - Trả về top K sản phẩm tương tự nhất
4. Hiển thị kết quả trên trang products với banner thông báo

## API Endpoints

### POST /api/image-search/search
Tìm kiếm sản phẩm bằng hình ảnh

**Request:**
- Form data: `image` (file)
- Hoặc JSON: `{ "image_base64": "..." }`

**Query params:**
- `top_k`: Số lượng kết quả (mặc định: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "...",
      "similarity": 0.95,
      "name": "Product Name",
      "price": 100000,
      "images": ["..."],
      "category": "...",
      "brand": "..."
    }
  ],
  "count": 10
}
```

### POST /api/image-search/update-embeddings
Cập nhật lại embeddings cho tất cả sản phẩm (sau khi thêm/sửa sản phẩm mới)

### GET /api/image-search/health
Kiểm tra trạng thái service

## Lưu ý

1. **Lần đầu chạy**: Python service sẽ tự động generate embeddings cho tất cả sản phẩm và cache vào MongoDB collection `product_embeddings`
2. **Sau khi thêm/sửa sản phẩm**: Cần gọi `/api/image-search/update-embeddings` để cập nhật embeddings
3. **Performance**: Embeddings được cache trong MongoDB, chỉ generate lại khi cần thiết
4. **File size limit**: Tối đa 10MB cho mỗi ảnh upload

## Troubleshooting

- **Lỗi kết nối Python service**: Kiểm tra xem service đã chạy chưa và port có đúng không
- **Lỗi không tìm thấy sản phẩm**: Kiểm tra xem có sản phẩm nào có ảnh trong database không
- **Lỗi memory**: Nếu có quá nhiều sản phẩm, có thể cần tăng memory cho Python process

