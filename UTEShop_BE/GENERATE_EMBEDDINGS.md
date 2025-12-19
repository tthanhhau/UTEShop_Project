# Hướng dẫn Generate Embeddings cho Image Search

## Vấn đề

Lỗi **"No product embeddings available"** xảy ra khi chưa có embeddings cho sản phẩm trong database. Embeddings là vector đại diện cho hình ảnh sản phẩm, cần thiết để so sánh và tìm kiếm.

## Giải pháp

### Cách 1: Gọi API update-embeddings (Khuyến nghị)

**Từ Postman hoặc curl:**

```bash
curl -X POST http://localhost:5000/api/image-search/update-embeddings
```

**Hoặc từ browser console (F12):**

```javascript
fetch('http://localhost:5000/api/image-search/update-embeddings', {
  method: 'POST'
})
.then(res => res.json())
.then(data => console.log(data));
```

**Hoặc từ terminal Node.js:**

```bash
cd UTEShop_BE
node -e "const axios = require('axios'); axios.post('http://localhost:5000/api/image-search/update-embeddings').then(r => console.log(r.data)).catch(e => console.error(e));"
```

### Cách 2: Tự động generate khi search (Đã được thêm vào code)

Code đã được cập nhật để tự động thử generate embeddings nếu chưa có. Tuy nhiên, lần đầu tiên có thể mất thời gian (vài phút tùy số lượng sản phẩm).

## Quá trình Generate Embeddings

1. **Lấy tất cả sản phẩm** có `isActive: true` và có ít nhất 1 hình ảnh
2. **Download hình ảnh** từ URL (Cloudinary hoặc nơi lưu trữ)
3. **Encode hình ảnh** thành vector embeddings bằng CLIP model
4. **Lưu vào MongoDB** collection `product_embeddings` để cache

## Thời gian

- **10 sản phẩm**: ~10-20 giây
- **100 sản phẩm**: ~2-5 phút
- **1000 sản phẩm**: ~20-30 phút

## Lưu ý

1. **Chỉ cần generate 1 lần** - embeddings được cache trong MongoDB
2. **Generate lại khi:**
   - Thêm sản phẩm mới
   - Cập nhật hình ảnh sản phẩm
   - Xóa sản phẩm

3. **Kiểm tra logs** trong Python service để xem tiến trình:
   ```
   Generating embeddings for all products...
   Encoding 100 images...
   [Progress bar sẽ hiển thị]
   ```

## Troubleshooting

### Lỗi "No products found"
- Kiểm tra có sản phẩm nào có `isActive: true` không
- Kiểm tra sản phẩm có field `images` và không rỗng không

### Lỗi "Error loading image"
- Kiểm tra URL hình ảnh có hợp lệ không
- Kiểm tra kết nối internet để download ảnh
- Một số URL có thể không truy cập được, service sẽ bỏ qua và tiếp tục

### Lỗi timeout
- Nếu có quá nhiều sản phẩm, có thể cần tăng timeout
- Hoặc generate từng batch nhỏ

