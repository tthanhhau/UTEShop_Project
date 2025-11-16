# Image Search Service

Service này sử dụng CLIP model để tìm kiếm sản phẩm bằng hình ảnh.

## Cài đặt

```bash
pip install -r requirements.txt
```

## Cấu hình MongoDB Atlas

Tạo file `.env` trong thư mục này:

**Cho MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop?retryWrites=true&w=majority
IMAGE_SEARCH_PORT=5002
```

**Cho MongoDB Local:**
```env
MONGODB_URI=mongodb://localhost:27017/uteshop
IMAGE_SEARCH_PORT=5002
```

**Lưu ý quan trọng:**
- Thay `username`, `password`, `cluster` bằng thông tin MongoDB Atlas của bạn
- Đảm bảo connection string có database name (`/uteshop`) ở cuối
- **Whitelist IP**: Vào MongoDB Atlas Dashboard → Network Access → Add IP Address
- Connection string phải có format: `mongodb+srv://.../database?retryWrites=true&w=majority`

## Chạy service

```bash
python app.py
```

Service sẽ chạy trên port 5002 (có thể thay đổi bằng biến môi trường `IMAGE_SEARCH_PORT`).

## API Endpoints

### POST /search
Tìm kiếm sản phẩm bằng hình ảnh.

**Request:**
- Form data với field `image` (file upload)
- Hoặc JSON với field `image_base64` (base64 encoded image)

**Query params:**
- `top_k`: Số lượng kết quả trả về (mặc định: 10)

**Response:**
```json
{
  "success": true,
  "results": [
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

### POST /update-embeddings
Cập nhật lại embeddings cho tất cả sản phẩm (sau khi thêm/sửa sản phẩm mới).

### GET /health
Kiểm tra trạng thái service.

