# Sửa lỗi "No active products with images found"

## Vấn đề

Lỗi này xảy ra khi không có sản phẩm nào thỏa mãn điều kiện:
- `isActive: true`
- `images` array không rỗng (có ít nhất 1 hình ảnh)

## Cách kiểm tra

### Cách 1: Chạy script kiểm tra (Khuyến nghị)

```bash
cd UTEShop_BE
npm run check:products
```

Script này sẽ:
- Đếm tổng số sản phẩm
- Đếm sản phẩm active
- Đếm sản phẩm có images
- Tự động sửa nếu có thể (set isActive=true cho sản phẩm inactive)
- Hiển thị gợi ý

### Cách 2: Kiểm tra thủ công qua MongoDB Atlas

1. Vào MongoDB Atlas Dashboard
2. Chọn database `uteshop`
3. Collection `products`
4. Chạy query:
   ```javascript
   // Đếm sản phẩm active và có images
   db.products.countDocuments({
     isActive: true,
     images: { $exists: true, $ne: [] }
   })
   ```

### Cách 3: Kiểm tra qua API

```bash
# Kiểm tra có sản phẩm nào không
curl http://localhost:5000/api/products?limit=1
```

## Cách sửa

### Nếu sản phẩm có `isActive: false`

Script sẽ tự động sửa. Hoặc sửa thủ công trong MongoDB Atlas:

```javascript
// Set tất cả sản phẩm thành active
db.products.updateMany(
  { isActive: false },
  { $set: { isActive: true } }
)
```

### Nếu sản phẩm không có images

Bạn cần thêm hình ảnh cho sản phẩm:

1. **Qua Admin Panel:**
   - Vào trang quản trị
   - Chỉnh sửa sản phẩm
   - Thêm hình ảnh

2. **Qua MongoDB Atlas:**
   ```javascript
   // Thêm hình ảnh cho sản phẩm
   db.products.updateOne(
     { _id: ObjectId("...") },
     { $set: { 
       images: [
         "https://res.cloudinary.com/.../image1.jpg",
         "https://res.cloudinary.com/.../image2.jpg"
       ]
     }}
   )
   ```

3. **Qua API Admin:**
   ```bash
   PUT /api/admin/products/:id
   {
     "images": ["url1", "url2", ...]
   }
   ```

### Nếu không có sản phẩm nào

Bạn cần tạo sản phẩm mới:

1. **Qua Admin Panel:** Tạo sản phẩm mới với hình ảnh
2. **Qua seed script:** Chạy `node seed.js` (nếu có)
3. **Qua API Admin:** POST `/api/admin/products`

## Sau khi sửa

1. Chạy lại script kiểm tra:
   ```bash
   npm run check:products
   ```

2. Gọi API generate embeddings:
   ```bash
   node -e "const axios = require('axios'); axios.post('http://localhost:5000/api/image-search/update-embeddings').then(r => console.log('✅', r.data)).catch(e => console.error('❌', e.response?.data || e.message));"
   ```

3. Test image search từ frontend

## Lưu ý

- Hình ảnh phải là URL hợp lệ (HTTP/HTTPS), không phải base64
- URL hình ảnh phải có thể truy cập được từ internet
- Nếu dùng Cloudinary, đảm bảo URL đúng format

