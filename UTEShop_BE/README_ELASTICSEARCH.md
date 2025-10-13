# 🔍 HƯỚNG DẪN SỬ DỤNG ELASTICSEARCH

## 📋 **Các bước cài đặt**

### 1️⃣ **Khởi động Elasticsearch với Docker**

```bash
# Từ thư mục gốc project (có file docker-compose.yml)
docker-compose up -d

# Kiểm tra container đang chạy
docker-compose ps

# Kiểm tra logs
docker-compose logs -f elasticsearch
```

### 2️⃣ **Cấu hình môi trường**

Tạo file `.env` trong `UTEShop_BE` (copy từ `.env.example`):

```env
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX_PRODUCTS=uteshop_products
```

### 3️⃣ **Đồng bộ dữ liệu**

```bash
cd UTEShop_BE
npm run sync:elasticsearch
```

Script này sẽ:
- ✅ Tạo index `uteshop_products` nếu chưa có
- ✅ Đồng bộ tất cả sản phẩm từ MongoDB vào Elasticsearch
- ✅ Thiết lập mapping tối ưu cho tìm kiếm tiếng Việt

---

## 🌐 **API Endpoints**

### 🔍 **1. Tìm kiếm sản phẩm**

```http
GET /api/elasticsearch/search
```

**Query Parameters:**
- `q` - Từ khóa tìm kiếm (VD: "áo sơ mi", "giay nike")
- `category` - Lọc theo danh mục
- `brand` - Lọc theo thương hiệu
- `minPrice` - Giá tối thiểu
- `maxPrice` - Giá tối đa
- `page` - Trang hiện tại (default: 1)
- `limit` - Số sản phẩm/trang (default: 12)
- `sort` - Sắp xếp:
  - `relevance` (mặc định) - Theo độ liên quan
  - `price-asc` - Giá tăng dần
  - `price-desc` - Giá giảm dần
  - `newest` - Mới nhất
  - `best-selling` - Bán chạy nhất
  - `top-rated` - Đánh giá cao nhất

**Ví dụ:**

```bash
# Tìm "áo", lọc danh mục "Áo", giá 100k-500k
curl "http://localhost:5000/api/elasticsearch/search?q=áo&category=Áo&minPrice=100000&maxPrice=500000"

# Tìm "giày nike", sắp xếp theo giá tăng dần
curl "http://localhost:5000/api/elasticsearch/search?q=giày nike&brand=Nike&sort=price-asc"

# Lấy tất cả sản phẩm, sắp xếp theo bán chạy
curl "http://localhost:5000/api/elasticsearch/search?sort=best-selling"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "673...",
      "name": "Áo sơ mi nam",
      "price": 299000,
      "discountedPrice": 239200,
      "discountPercentage": 20,
      "images": ["url1", "url2"],
      "category": {
        "_id": "672...",
        "name": "Áo"
      },
      "brand": {
        "_id": "671...",
        "name": "Zara"
      },
      "_score": 1.234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  },
  "facets": {
    "categories": [
      { "key": "Áo", "doc_count": 25 },
      { "key": "Quần", "doc_count": 20 }
    ],
    "brands": [
      { "key": "Nike", "doc_count": 15 },
      { "key": "Adidas", "doc_count": 10 }
    ],
    "priceRanges": [
      { "key": "under-500k", "doc_count": 12 },
      { "key": "500k-1m", "doc_count": 18 }
    ],
    "priceStats": {
      "min": 100000,
      "max": 5000000,
      "avg": 750000
    }
  }
}
```

---

### 💡 **2. Gợi ý tìm kiếm (Autocomplete)**

```http
GET /api/elasticsearch/suggest
```

**Query Parameters:**
- `q` - Từ khóa (tối thiểu 2 ký tự)
- `limit` - Số gợi ý (default: 5)

**Ví dụ:**

```bash
curl "http://localhost:5000/api/elasticsearch/suggest?q=áo&limit=5"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "673...",
      "name": "Áo sơ mi nam",
      "price": 299000,
      "discountedPrice": 239200,
      "images": ["url1"]
    }
  ]
}
```

---

### 📊 **3. Lấy facets (bộ lọc)**

```http
GET /api/elasticsearch/facets
```

Trả về thống kê về categories, brands, price ranges.

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": [
      { "key": "Áo", "doc_count": 25 },
      { "key": "Quần", "doc_count": 20 }
    ],
    "brands": [
      { "key": "Nike", "doc_count": 15 }
    ],
    "priceRanges": [...],
    "priceStats": {
      "min": 100000,
      "max": 5000000,
      "avg": 750000
    }
  }
}
```

---

### ❤️ **4. Health Check**

```http
GET /api/elasticsearch/health
```

Kiểm tra Elasticsearch có đang chạy không.

**Response:**

```json
{
  "success": true,
  "message": "Elasticsearch đang hoạt động"
}
```

---

### 🔧 **5. Admin: Đồng bộ một sản phẩm**

```http
POST /api/elasticsearch/sync/:productId
```

Đồng bộ một sản phẩm cụ thể vào Elasticsearch (sau khi tạo/sửa).

---

### 🗑️ **6. Admin: Xóa sản phẩm khỏi Elasticsearch**

```http
DELETE /api/elasticsearch/delete/:productId
```

Xóa một sản phẩm khỏi Elasticsearch (sau khi xóa khỏi MongoDB).

---

## 🎨 **Tích hợp vào Frontend**

### **Ví dụ: Tìm kiếm với React**

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function SearchProducts() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState(null);

  const searchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/elasticsearch/search', {
        params: {
          q: query,
          page: 1,
          limit: 12,
          sort: 'relevance'
        }
      });
      setProducts(data.data);
      setFacets(data.facets);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchProducts();
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm sản phẩm..."
      />
      
      {loading && <p>Đang tìm kiếm...</p>}
      
      {/* Facets */}
      {facets && (
        <div>
          <h3>Danh mục:</h3>
          {facets.categories.map(cat => (
            <button key={cat.key}>
              {cat.key} ({cat.doc_count})
            </button>
          ))}
        </div>
      )}
      
      {/* Products */}
      <div>
        {products.map(product => (
          <div key={product._id}>
            <h4>{product.name}</h4>
            <p>{product.discountedPrice.toLocaleString()}đ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### **Ví dụ: Autocomplete với React**

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await axios.get('/api/elasticsearch/suggest', {
          params: { q: query, limit: 5 }
        });
        setSuggestions(data.data);
      } catch (error) {
        console.error('Suggest error:', error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm..."
      />
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map(item => (
            <div key={item._id} className="suggestion-item">
              <img src={item.images[0]} alt={item.name} />
              <span>{item.name}</span>
              <span>{item.discountedPrice.toLocaleString()}đ</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 **Auto-sync khi CRUD sản phẩm**

Để tự động đồng bộ khi tạo/sửa/xóa sản phẩm, thêm code sau vào controller:

```javascript
import elasticsearchService from '../services/elasticsearchService.js';

// Trong createProduct
const newProduct = await Product.create(productData);
await elasticsearchService.indexProduct(newProduct);

// Trong updateProduct
const updated = await Product.findByIdAndUpdate(id, data, { new: true })
  .populate('category', 'name')
  .populate('brand', 'name');
await elasticsearchService.indexProduct(updated);

// Trong deleteProduct
await Product.findByIdAndDelete(id);
await elasticsearchService.deleteProduct(id);
```

---

## 🚀 **Tính năng nổi bật**

✅ **Full-text search** - Tìm kiếm toàn văn trong tên và mô tả  
✅ **Fuzzy matching** - Chịu lỗi chính tả (VD: "aó" → "áo")  
✅ **Vietnamese support** - Hỗ trợ tiếng Việt có dấu  
✅ **Multi-field search** - Tìm trong nhiều trường (name, description)  
✅ **Faceted search** - Lọc theo category, brand, price range  
✅ **Flexible sorting** - Sắp xếp linh hoạt (relevance, price, date, rating)  
✅ **Autocomplete** - Gợi ý tìm kiếm theo từ khóa  
✅ **Aggregations** - Thống kê facets và price range  
✅ **Performance** - Cực nhanh, có thể xử lý hàng triệu sản phẩm  

---

## 🛠️ **Troubleshooting**

### **Lỗi: Connection refused**

```bash
# Kiểm tra Elasticsearch đang chạy
curl http://localhost:9200

# Khởi động lại
docker-compose restart elasticsearch
```

### **Lỗi: Index not found**

```bash
# Chạy lại sync
cd UTEShop_BE
npm run sync:elasticsearch
```

### **Tìm kiếm không ra kết quả**

```bash
# Kiểm tra số documents trong index
curl http://localhost:9200/uteshop_products/_count

# Xem mapping
curl http://localhost:9200/uteshop_products/_mapping?pretty
```

---

## 📚 **Tài liệu tham khảo**

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch Node.js Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
- [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

---

**🎉 ELASTICSEARCH ĐÃ SẴNG SÀNG! TÌM KIẾM CỰC NHANH!** 🚀

