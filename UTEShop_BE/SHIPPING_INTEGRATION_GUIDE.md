# Hướng dẫn tích hợp API Giao hàng

## Tổng quan

Hệ thống hỗ trợ tích hợp với các đơn vị vận chuyển phổ biến tại Việt Nam:
- **GHN** (Giao Hàng Nhanh) - Đã tích hợp đầy đủ
- **GHTK** (Giao Hàng Tiết Kiệm) - Đã tích hợp đầy đủ
- **Viettel Post** - Sẽ được bổ sung

## Cấu hình

### 1. Đăng ký tài khoản đơn vị vận chuyển

#### GHN (Giao Hàng Nhanh)
1. Truy cập: https://sso.ghn.vn/
2. Đăng ký tài khoản doanh nghiệp
3. Lấy thông tin:
   - Token API
   - Shop ID
   - District ID của kho hàng

#### GHTK (Giao Hàng Tiết Kiệm)
1. Truy cập: https://khachhang.giaohangtietkiem.vn/
2. Đăng ký tài khoản
3. Lấy Token API từ phần cài đặt

#### Viettel Post
1. Truy cập: https://viettelpost.vn/
2. Liên hệ để đăng ký tài khoản doanh nghiệp

### 2. Cấu hình file .env

```env
# Đơn vị vận chuyển mặc định
SHIPPING_PROVIDER=GHN

# GHTK Configuration
GHTK_API_URL=https://services.giaohangtietkiem.vn/services
GHTK_TOKEN=your_token_here
GHTK_PICK_NAME=UTEShop
GHTK_PICK_ADDRESS=123 Nguyen Van Cu, District 5
GHTK_PICK_PROVINCE=TP. Hồ Chí Minh
GHTK_PICK_DISTRICT=Quận 5
GHTK_PICK_WARD=Phường 1
GHTK_PICK_TEL=0123456789

# GHN Configuration
GHN_API_URL=https://dev-online-gateway.ghn.vn/shiip/public-api
GHN_TOKEN=your_token_here
GHN_SHOP_ID=your_shop_id
GHN_FROM_DISTRICT_ID=1542

# GHTK Configuration
GHTK_API_URL=https://services.giaohangtietkiem.vn/services
GHTK_TOKEN=your_token_here
GHTK_PICK_NAME=UTEShop
GHTK_PICK_ADDRESS=123 Nguyen Van Cu, District 5
GHTK_PICK_PROVINCE=TP. Hồ Chí Minh
GHTK_PICK_DISTRICT=Quận 5
GHTK_PICK_WARD=Phường 1
GHTK_PICK_TEL=0123456789
```

## API Endpoints

### 1. Lấy danh sách địa chỉ

#### Lấy danh sách tỉnh/thành phố
```http
GET /api/shipping/provinces?provider=GHN
```

#### Lấy danh sách quận/huyện
```http
GET /api/shipping/districts?provinceId=202&provider=GHN
```

#### Lấy danh sách phường/xã
```http
GET /api/shipping/wards?districtId=1542&provider=GHN
```

### 2. Tính phí vận chuyển

```http
POST /api/shipping/calculate-fee
Authorization: Bearer {token}
Content-Type: application/json

{
  "toDistrictId": "1542",
  "toWardCode": "21012",
  "weight": 1000,
  "insuranceValue": 500000,
  "provider": "GHN"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "GHN",
  "fee": 25000,
  "serviceFee": 23000,
  "insuranceFee": 2000,
  "expectedDeliveryTime": "2024-02-10T10:00:00.000Z"
}
```

### 3. Tạo đơn giao hàng

```http
POST /api/shipping/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "65abc123def456789",
  "toDistrictId": "1542",
  "toWardCode": "21012",
  "note": "Giao hàng giờ hành chính",
  "provider": "GHN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping order created successfully",
  "order": {
    "_id": "65abc123def456789",
    "shippingInfo": {
      "provider": "GHN",
      "trackingCode": "GHNABCD123",
      "shippingFee": 25000,
      "expectedDeliveryTime": "2024-02-10T10:00:00.000Z"
    }
  },
  "shipping": {
    "trackingCode": "GHNABCD123",
    "totalFee": 25000
  }
}
```

### 4. Tra cứu trạng thái vận đơn

#### Tra cứu theo mã vận đơn
```http
GET /api/shipping/track?trackingCode=GHNABCD123&provider=GHN
Authorization: Bearer {token}
```

#### Tra cứu theo Order ID
```http
GET /api/shipping/track/65abc123def456789
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "provider": "GHN",
  "trackingCode": "GHNABCD123",
  "status": "delivering",
  "statusText": "Đang giao hàng",
  "logs": [
    {
      "status": "picked",
      "time": "2024-02-08T10:00:00.000Z",
      "message": "Đã lấy hàng"
    },
    {
      "status": "delivering",
      "time": "2024-02-09T08:00:00.000Z",
      "message": "Đang giao hàng"
    }
  ]
}
```

### 5. Hủy đơn giao hàng

```http
POST /api/shipping/cancel/65abc123def456789
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping order cancelled successfully"
}
```

## Tích hợp vào Frontend

### 1. Tạo API service

```javascript
// src/api/shippingApi.js
import axiosInstance from './axiosConfig';

export const shippingApi = {
  // Lấy danh sách tỉnh/thành
  getProvinces: (provider = 'GHN') => 
    axiosInstance.get(`/shipping/provinces?provider=${provider}`),

  // Lấy danh sách quận/huyện
  getDistricts: (provinceId, provider = 'GHN') => 
    axiosInstance.get(`/shipping/districts?provinceId=${provinceId}&provider=${provider}`),

  // Lấy danh sách phường/xã
  getWards: (districtId, provider = 'GHN') => 
    axiosInstance.get(`/shipping/wards?districtId=${districtId}&provider=${provider}`),

  // Tính phí vận chuyển
  calculateFee: (data) => 
    axiosInstance.post('/shipping/calculate-fee', data),

  // Tra cứu đơn hàng
  trackOrder: (orderId) => 
    axiosInstance.get(`/shipping/track/${orderId}`),
};
```

### 2. Component chọn địa chỉ

```jsx
import { useState, useEffect } from 'react';
import { shippingApi } from '@/api/shippingApi';

function AddressSelector() {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [shippingFee, setShippingFee] = useState(0);

  // Load provinces
  useEffect(() => {
    shippingApi.getProvinces().then(res => {
      setProvinces(res.data.data);
    });
  }, []);

  // Load districts khi chọn province
  useEffect(() => {
    if (selectedProvince) {
      shippingApi.getDistricts(selectedProvince).then(res => {
        setDistricts(res.data.data);
      });
    }
  }, [selectedProvince]);

  // Load wards khi chọn district
  useEffect(() => {
    if (selectedDistrict) {
      shippingApi.getWards(selectedDistrict).then(res => {
        setWards(res.data.data);
      });
    }
  }, [selectedDistrict]);

  // Tính phí vận chuyển
  const calculateShippingFee = async () => {
    if (selectedDistrict && selectedWard) {
      const res = await shippingApi.calculateFee({
        toDistrictId: selectedDistrict,
        toWardCode: selectedWard,
        weight: 1000,
        insuranceValue: 500000,
      });
      setShippingFee(res.data.fee);
    }
  };

  return (
    <div>
      <select onChange={(e) => setSelectedProvince(e.target.value)}>
        <option value="">Chọn Tỉnh/Thành phố</option>
        {provinces.map(p => (
          <option key={p.ProvinceID} value={p.ProvinceID}>
            {p.ProvinceName}
          </option>
        ))}
      </select>

      <select onChange={(e) => setSelectedDistrict(e.target.value)}>
        <option value="">Chọn Quận/Huyện</option>
        {districts.map(d => (
          <option key={d.DistrictID} value={d.DistrictID}>
            {d.DistrictName}
          </option>
        ))}
      </select>

      <select onChange={(e) => setSelectedWard(e.target.value)}>
        <option value="">Chọn Phường/Xã</option>
        {wards.map(w => (
          <option key={w.WardCode} value={w.WardCode}>
            {w.WardName}
          </option>
        ))}
      </select>

      <button onClick={calculateShippingFee}>
        Tính phí vận chuyển
      </button>

      {shippingFee > 0 && (
        <p>Phí vận chuyển: {shippingFee.toLocaleString()}đ</p>
      )}
    </div>
  );
}
```

### 3. Component theo dõi đơn hàng

```jsx
import { useState, useEffect } from 'react';
import { shippingApi } from '@/api/shippingApi';

function OrderTracking({ orderId }) {
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await shippingApi.trackOrder(orderId);
        setTracking(res.data.shipping);
      } catch (error) {
        console.error('Error tracking order:', error);
      }
    };

    fetchTracking();
    // Refresh mỗi 5 phút
    const interval = setInterval(fetchTracking, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!tracking) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Theo dõi đơn hàng</h3>
      <p>Mã vận đơn: {tracking.trackingCode}</p>
      <p>Trạng thái: {tracking.statusText}</p>
      
      <div className="timeline">
        {tracking.logs?.map((log, index) => (
          <div key={index} className="timeline-item">
            <p>{log.message}</p>
            <small>{new Date(log.time).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Flow hoạt động

### 1. Khi khách hàng đặt hàng
1. Khách chọn địa chỉ (Tỉnh/Quận/Phường)
2. Hệ thống tính phí vận chuyển
3. Hiển thị tổng tiền (giá sản phẩm + phí ship)
4. Khách xác nhận đặt hàng

### 2. Khi Admin xử lý đơn hàng
1. Admin xem đơn hàng mới
2. Chuẩn bị hàng và đổi trạng thái sang "processing"
3. Gọi API tạo đơn giao hàng
4. Hệ thống nhận mã vận đơn và lưu vào database
5. Đổi trạng thái đơn hàng sang "shipped"

### 3. Khách hàng theo dõi đơn hàng
1. Vào trang "Đơn hàng của tôi"
2. Click vào đơn hàng cần xem
3. Xem mã vận đơn và trạng thái giao hàng real-time

## Lưu ý quan trọng

### 1. Môi trường Test vs Production
- GHN có 2 môi trường:
  - Test: `https://dev-online-gateway.ghn.vn/shiip/public-api`
  - Production: `https://online-gateway.ghn.vn/shiip/public-api`
- Nhớ đổi URL khi lên production

### 2. Xử lý lỗi
- Luôn có try-catch khi gọi API
- Hiển thị thông báo lỗi rõ ràng cho user
- Log lỗi để debug

### 3. Webhook (Tùy chọn)
Các đơn vị vận chuyển có thể gửi webhook khi trạng thái đơn hàng thay đổi. Bạn có thể tạo endpoint để nhận webhook:

```javascript
// src/routes/webhookRoutes.js
router.post('/webhook/ghn', async (req, res) => {
  const { OrderCode, Status } = req.body;
  
  // Cập nhật trạng thái đơn hàng
  await Order.findOneAndUpdate(
    { 'shippingInfo.trackingCode': OrderCode },
    { 
      'shippingInfo.status': Status,
      status: mapStatusToOrderStatus(Status)
    }
  );
  
  res.status(200).json({ success: true });
});
```

## Troubleshooting

### Lỗi "Token không hợp lệ"
- Kiểm tra lại token trong file .env
- Đảm bảo token chưa hết hạn

### Lỗi "Shop ID không tồn tại"
- Kiểm tra Shop ID có đúng không
- Đảm bảo shop đã được kích hoạt

### Không tính được phí vận chuyển
- Kiểm tra District ID và Ward Code có đúng không
- Đảm bảo địa chỉ kho hàng đã được cấu hình

## Tài liệu tham khảo

- [GHN API Documentation](https://api.ghn.vn/home/docs/detail)
- [GHTK API Documentation](https://docs.giaohangtietkiem.vn/)
- [Viettel Post API Documentation](https://viettelpost.vn/thong-tin-ho-tro/huong-dan-su-dung-api)
