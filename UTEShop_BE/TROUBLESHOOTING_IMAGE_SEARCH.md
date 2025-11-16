# Troubleshooting Image Search

## Lỗi 500 Internal Server Error

### Nguyên nhân phổ biến:

1. **Python service không chạy**
   - Kiểm tra: `python app.py` trong `UTEShop_BE/image_search_service/`
   - Service phải chạy trên port 5002
   - Test: `curl http://localhost:5002/health`

2. **MongoDB Atlas connection failed**
   - Kiểm tra connection string trong `.env`
   - Đảm bảo IP đã được whitelist trong MongoDB Atlas
   - Test connection trong Python service logs

3. **File upload không được xử lý đúng**
   - Kiểm tra backend logs để xem `req.file` có tồn tại không
   - Kiểm tra multer configuration

### Cách debug:

1. **Kiểm tra backend logs:**
   ```
   📸 Image search request received
   Request file: exists/missing
   🔍 Searching with top_k=20, service URL: http://localhost:5002
   ```

2. **Kiểm tra Python service:**
   ```bash
   cd UTEShop_BE/image_search_service
   python app.py
   ```
   - Phải thấy: `✅ MongoDB Atlas connected successfully`
   - Phải thấy: `✅ Image model loaded successfully`

3. **Test Python service trực tiếp:**
   ```bash
   curl -X POST http://localhost:5002/health
   # Should return: {"status":"ok"}
   ```

4. **Kiểm tra biến môi trường:**
   - Backend `.env`: `IMAGE_SEARCH_SERVICE_URL=http://localhost:5002`
   - Python service `.env`: `MONGODB_URI=...` và `IMAGE_SEARCH_PORT=5002`

### Lỗi cụ thể:

#### ECONNREFUSED
- **Nguyên nhân**: Python service không chạy
- **Giải pháp**: Khởi động Python service

#### MongoDB connection error
- **Nguyên nhân**: Connection string sai hoặc IP chưa whitelist
- **Giải pháp**: Kiểm tra `.env` và MongoDB Atlas Network Access

#### No product embeddings available
- **Nguyên nhân**: Chưa có embeddings trong database
- **Giải pháp**: Gọi `/api/image-search/update-embeddings` để generate embeddings

