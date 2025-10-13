# 🔍 ELASTICSEARCH SETUP GUIDE

## 📋 Giới thiệu

Hệ thống tìm kiếm UTEShop sử dụng Elasticsearch để cung cấp khả năng tìm kiếm nhanh, chính xác và mạnh mẽ.

## 🚀 Khởi động Elasticsearch

### Bước 1: Khởi động Docker containers

```bash
# Khởi động Elasticsearch và Kibana
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f elasticsearch
```

### Bước 2: Kiểm tra Elasticsearch đang chạy

```bash
# Kiểm tra health
curl http://localhost:9200/_cluster/health

# Kiểm tra version
curl http://localhost:9200
```

### Bước 3: Truy cập Kibana (tùy chọn)

```
http://localhost:5601
```

Kibana cung cấp giao diện để quản lý và giám sát Elasticsearch.

## 📦 Cài đặt dependencies

```bash
cd UTEShop_BE
npm install @elastic/elasticsearch
```

## 🔧 Cấu hình

### File .env

```env
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PRODUCTS=uteshop_products
ELASTICSEARCH_INDEX_ORDERS=uteshop_orders
```

## 📊 Sync dữ liệu

### Đồng bộ sản phẩm vào Elasticsearch

```bash
cd UTEShop_BE
npm run sync:elasticsearch
```

Script này sẽ:
- Tạo index products nếu chưa có
- Đồng bộ tất cả sản phẩm từ MongoDB vào Elasticsearch
- Thiết lập mapping tối ưu cho tìm kiếm

## 🔍 Tính năng tìm kiếm

### 1. Full-text Search
- Tìm kiếm theo tên sản phẩm
- Tìm kiếm theo mô tả
- Hỗ trợ tiếng Việt có dấu

### 2. Fuzzy Search
- Tìm kiếm gần đúng (chịu lỗi chính tả)
- Tự động gợi ý

### 3. Filtering
- Lọc theo danh mục
- Lọc theo thương hiệu
- Lọc theo khoảng giá
- Lọc theo đánh giá

### 4. Sorting
- Sắp xếp theo độ liên quan
- Sắp xếp theo giá
- Sắp xếp theo ngày tạo
- Sắp xếp theo bán chạy

### 5. Faceting
- Đếm số lượng sản phẩm theo category
- Đếm số lượng sản phẩm theo brand
- Thống kê khoảng giá

## 🛠️ Commands hữu ích

### Dừng Elasticsearch

```bash
docker-compose down
```

### Dừng và xóa dữ liệu

```bash
docker-compose down -v
```

### Khởi động lại

```bash
docker-compose restart elasticsearch
```

### Xem logs

```bash
docker-compose logs -f elasticsearch
```

### Kiểm tra indices

```bash
# Liệt kê tất cả indices
curl http://localhost:9200/_cat/indices?v

# Xem mapping của index
curl http://localhost:9200/uteshop_products/_mapping?pretty

# Đếm số documents
curl http://localhost:9200/uteshop_products/_count?pretty
```

### Xóa index (để tạo lại)

```bash
curl -X DELETE http://localhost:9200/uteshop_products
```

## 📈 Hiệu suất

### Memory Settings
- Mặc định: 512MB heap size
- Nếu cần nhiều hơn, chỉnh trong `docker-compose.yml`:
  ```yaml
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
  ```

### Shards và Replicas
- Development: 1 shard, 0 replica
- Production: Tùy thuộc vào số lượng nodes

## 🐛 Troubleshooting

### Lỗi: "max virtual memory areas too low"

**Linux:**
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

**Windows (WSL2):**
```powershell
wsl -d docker-desktop
sysctl -w vm.max_map_count=262144
```

### Lỗi: "Connection refused"

1. Kiểm tra container đang chạy:
   ```bash
   docker-compose ps
   ```

2. Kiểm tra logs:
   ```bash
   docker-compose logs elasticsearch
   ```

3. Khởi động lại:
   ```bash
   docker-compose restart elasticsearch
   ```

### Lỗi: "Out of memory"

Tăng heap size trong `docker-compose.yml`:
```yaml
- "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

## 🔐 Bảo mật (Production)

Trong production, nên bật security:

```yaml
environment:
  - xpack.security.enabled=true
  - ELASTIC_PASSWORD=your_password
```

## 📚 API Endpoints

### Search Products
```
GET /api/products/search?q=áo&category=Áo&minPrice=100000&maxPrice=500000
```

### Suggestions
```
GET /api/products/suggest?q=ao
```

### Facets
```
GET /api/products/facets
```

## 🎯 Best Practices

1. **Đồng bộ dữ liệu định kỳ**: Chạy sync mỗi khi có thay đổi lớn
2. **Monitoring**: Sử dụng Kibana để theo dõi hiệu suất
3. **Backup**: Backup indices quan trọng định kỳ
4. **Index Management**: Xóa các indices cũ không dùng

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker-compose logs elasticsearch`
2. Kiểm tra health: `curl http://localhost:9200/_cluster/health`
3. Khởi động lại: `docker-compose restart`

