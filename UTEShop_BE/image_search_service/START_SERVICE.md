# Hướng dẫn khởi động Image Search Service

## Bước 1: Kiểm tra Python đã cài đặt

```bash
python --version
# Hoặc
python3 --version
```

Phải là Python 3.8 trở lên.

## Bước 2: Cài đặt dependencies

```bash
cd UTEShop_BE/image_search_service
pip install -r requirements.txt
```

**Lưu ý:** Nếu gặp lỗi với `sentence-transformers`, thử:
```bash
pip install --upgrade sentence-transformers>=2.3.0 huggingface-hub>=0.19.0
```

## Bước 3: Tạo file .env (nếu chưa có)

Tạo file `.env` trong thư mục `UTEShop_BE/image_search_service/`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uteshop?retryWrites=true&w=majority
IMAGE_SEARCH_PORT=5002
```

## Bước 4: Khởi động service

```bash
cd UTEShop_BE/image_search_service
python app.py
```

**Khi service khởi động thành công, bạn sẽ thấy:**
```
Loading CLIP model for images...
✅ Image model loaded successfully
✅ MongoDB Atlas connected successfully
 * Running on http://0.0.0.0:5002
 * Debug mode: on
```

## Bước 5: Kiểm tra service đang chạy

Mở browser và truy cập:
- `http://localhost:5002` - Xem thông tin service
- `http://localhost:5002/health` - Kiểm tra health check

Hoặc dùng curl:
```bash
curl http://localhost:5002
curl http://localhost:5002/health
```

## Lỗi thường gặp:

### 1. "ModuleNotFoundError: No module named 'flask'"
**Giải pháp:** Cài đặt lại dependencies
```bash
pip install -r requirements.txt
```

### 2. "ImportError: cannot import name 'cached_download'"
**Giải pháp:** Cập nhật sentence-transformers
```bash
pip install --upgrade sentence-transformers>=2.3.0
```

### 3. "MongoDB Atlas connection warning"
**Giải pháp:** 
- Kiểm tra connection string trong `.env`
- Kiểm tra IP đã được whitelist trong MongoDB Atlas
- Kiểm tra username/password đúng chưa

### 4. Port 5002 đã được sử dụng
**Giải pháp:** Đổi port trong `.env`:
```env
IMAGE_SEARCH_PORT=5003
```

## Chạy service trong background (Windows PowerShell)

```powershell
Start-Process python -ArgumentList "app.py" -WorkingDirectory "D:\Nam4HK1\cnpmm_nop\UTEShop_Project\UTEShop_BE\image_search_service"
```

## Chạy service trong background (Linux/Mac)

```bash
nohup python app.py > service.log 2>&1 &
```

