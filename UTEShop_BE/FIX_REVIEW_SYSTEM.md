# Sửa lỗi hệ thống đánh giá - Ngăn người dùng đánh giá lại sau khi admin xóa bình luận

## Vấn đề

Khi người dùng đánh giá sản phẩm và admin xóa bình luận đó, hệ thống chỉ xóa bản ghi trong collection `Review` nhưng không cập nhật trạng thái đánh giá trong đơn hàng. Điều này cho phép người dùng đánh giá lại cùng một sản phẩm từ cùng một đơn hàng và nhận điểm tích lũy/voucher nhiều lần.

## Giải pháp

### 1. Thay đổi model Order

Thêm các trường mới vào model `Order` để theo dõi trạng thái đánh giá:

```javascript
// Thêm trường để theo dõi trạng thái đánh giá
reviewStatus: {
  type: String,
  enum: ["pending", "reviewed", "review_deleted"],
  default: "pending"
},
reviewedAt: { type: Date },
reviewDeletedAt: { type: Date },
```

### 2. Cập nhật logic trong ReviewController

- Khi tạo review mới: Cập nhật trạng thái đơn hàng thành "reviewed"
- Khi user xóa review: Cập nhật trạng thái đơn hàng thành "review_deleted"
- Khi admin xóa review: Đánh dấu review là đã xóa và cập nhật trạng thái đơn hàng thành "review_deleted"
- Khi kiểm tra review: Kiểm tra cả collection Review và trạng thái review trong đơn hàng
- Khi hiển thị review: Không hiển thị các review đã bị xóa

### 3. Thêm endpoint mới cho admin

Thêm endpoint `DELETE /api/reviews/admin/:reviewId` để admin có thể xóa review và cập nhật trạng thái đơn hàng tương ứng.

## Cách sử dụng

### 1. Chạy script cập nhật dữ liệu cũ

Để đảm bảo tính nhất quán cho dữ liệu hiện có, chạy script sau:

```bash
cd UTEShop_BE
node scripts/update-order-review-status.js
```

Script này sẽ:
- Tìm tất cả các review hiện có và cập nhật trạng thái đơn hàng tương ứng
- Xử lý cả các review đã bị xóa (isDeleted: true)

### 2. Kiểm tra hệ thống

Sau khi áp dụng các thay đổi:

1. Người dùng chỉ có thể đánh giá một đơn hàng một lần
2. Khi admin xóa review, người dùng không thể đánh giá lại cùng một đơn hàng
3. Các review đã bị xóa sẽ không hiển thị ở phía frontend
4. Trạng thái review được lưu trong cả collection Review và model Order

## Lợi ích

- Ngăn chặn việc lạm dụng hệ thống đánh giá để nhận điểm/voucher không giới hạn
- Duy trì tính nhất quán của dữ liệu
- Cung cấp lịch sử đầy đủ về trạng thái đánh giá của đơn hàng
- Hỗ trợ việc khôi phục review nếu cần (vì admin chỉ đánh dấu là xóa chứ không xóa vĩnh viễn)

## Các file đã thay đổi

1. `src/models/order.js` - Thêm trường theo dõi trạng thái review
2. `src/controllers/ReviewController.js` - Cập nhật logic xử lý review
3. `src/routes/reviewRoutes.js` - Thêm endpoint mới cho admin
4. `scripts/update-order-review-status.js` - Script cập nhật dữ liệu cũ