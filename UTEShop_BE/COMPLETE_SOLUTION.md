# ✅ GIẢI PHÁP HOÀN CHỈNH: Ngăn user bình luận lại sau khi admin xóa

## 🎯 YÊU CẦU
User chỉ được bình luận 1 lần duy nhất cho mỗi đơn hàng. Khi admin xóa bình luận, user KHÔNG được bình luận lại.

## 📋 LOGIC ĐƠN GIẢN

### 1. Khi user tạo review:
```javascript
// Kiểm tra xem order đã có review chưa (kể cả đã xóa)
const existingReview = await Review.findOne({ order: orderId });
if (existingReview) {
  return "Bạn đã đánh giá đơn hàng này rồi";
}

// Tạo review mới
const review = new Review({ user, product, rating, comment, order });
await review.save();

// Cập nhật order
await Order.findByIdAndUpdate(orderId, {
  reviewStatus: "reviewed",
  reviewedAt: new Date()
});
```

### 2. Khi admin xóa review:
```javascript
// Soft delete review
review.isDeleted = true;
review.deletedBy = adminId;
review.deletedAt = new Date();
await review.save();

// Cập nhật order
await Order.findByIdAndUpdate(review.order, {
  reviewStatus: "review_deleted",
  reviewDeletedAt: new Date()
});
```

### 3. Khi frontend kiểm tra có thể review không:
```javascript
// API: GET /reviews/order/:orderId/check
const review = await Review.findOne({ order: orderId });
const orderReviewStatus = order.reviewStatus || "pending";

// User đã review nếu:
// - Có review trong DB (kể cả isDeleted = true) HOẶC
// - reviewStatus = "reviewed" hoặc "review_deleted"
const hasReviewed = !!review || 
                    orderReviewStatus === "reviewed" || 
                    orderReviewStatus === "review_deleted";

return { hasReview: hasReviewed };
```

### 4. Frontend hiển thị nút:
```javascript
const reviewCheck = await checkOrderReviewed(orderId);
const canReview = !reviewCheck.hasReview;

// Nếu hasReview = true → Nút "Đánh giá" TẮT
// Nếu hasReview = false → Nút "Đánh giá" SÁNG
```

## 🔧 CÁC FILE CẦN SỬA

### Backend (UTEShop_BE):

#### 1. `src/controllers/ReviewController.js`
```javascript
// createReview - Dòng ~30
if (orderId) {
  const existingReview = await Review.findOne({ order: orderId });
  if (existingReview) {
    return res.status(400).json({
      message: "Bạn đã đánh giá đơn hàng này rồi, không thể đánh giá lại"
    });
  }
}

// createReview - Dòng ~60
if (order.reviewStatus === "reviewed" || order.reviewStatus === "review_deleted") {
  return res.status(400).json({ 
    message: "Bạn đã đánh giá đơn hàng này rồi, không thể đánh giá lại" 
  });
}

// checkOrderReviewed - Dòng ~460
const hasReviewed = !!review || 
                    orderReviewStatus === "reviewed" || 
                    orderReviewStatus === "review_deleted";
```

#### 2. `src/routes/internalRoutes.js`
```javascript
// DELETE /reviews/:reviewId - Dòng ~85
review.isDeleted = true;
review.deletedBy = req.user?.id || null;
review.deletedAt = new Date();
await review.save();

// Cập nhật order
if (review.order) {
  await Order.findByIdAndUpdate(review.order, {
    reviewStatus: "review_deleted",
    reviewDeletedAt: new Date()
  });
}
```

### Admin Backend (UTEShop_BE_Admin):

#### 3. `src/review/ReviewService.ts`
```typescript
// getAllReviews - Dòng ~28
const filter: any = {
  isDeleted: { $ne: true }  // Không hiển thị reviews đã xóa
};

// getReviewStats - Dòng ~340
const stats = await this.reviewModel.aggregate([
  { $match: { isDeleted: { $ne: true } } },  // Chỉ tính reviews chưa xóa
  ...
]);

// deleteReview - Dòng ~290
review.isDeleted = true;
review.deletedBy = new Types.ObjectId(adminId);
review.deletedAt = new Date();
await review.save();

if (review.order) {
  await this.orderModel.findByIdAndUpdate(review.order, {
    reviewStatus: 'review_deleted',
    reviewDeletedAt: new Date()
  });
}
```

#### 4. `src/review/ReviewModule.ts`
```typescript
import { Order, OrderSchema } from '../schemas/OrderSchema';

MongooseModule.forFeature([
  { name: Review.name, schema: ReviewSchema },
  { name: Order.name, schema: OrderSchema },  // Thêm dòng này
  ...
]),
```

### Frontend (UTEShop_FE):

#### 5. `src/pages/Profile/purchaseHistory.jsx` & `orderTracking.jsx`
```javascript
// Dòng ~50
const reviewCheck = await checkOrderReviewed(order._id);
reviewStatusMap[order._id] = reviewCheck.hasReview;  // Đơn giản hóa
```

## 🚀 HƯỚNG DẪN THỰC HIỆN

### Bước 1: Kiểm tra code đã sửa đúng chưa
```bash
cd UTEShop_BE
# Kiểm tra ReviewController.js
# Kiểm tra internalRoutes.js

cd ../UTEShop_BE_Admin
# Kiểm tra ReviewService.ts
# Kiểm tra ReviewModule.ts
```

### Bước 2: Restart cả 2 backend
```bash
# Terminal 1: User Backend
cd UTEShop_BE
npm start

# Terminal 2: Admin Backend
cd UTEShop_BE_Admin
npm run start:dev
```

### Bước 3: Clear cache frontend
- User: Ctrl+Shift+R
- Admin: Ctrl+Shift+R

### Bước 4: Test
1. User tạo review → OK
2. Admin xóa review → Xem log có "review_deleted"
3. User reload → Nút "Đánh giá" TẮT
4. User thử bình luận → Bị chặn

## 🧪 SCRIPT TEST

```bash
cd UTEShop_BE

# Test 1: Kiểm tra order cụ thể
# Sửa ORDER_ID trong file test-review-check.js
node test-review-check.js

# Test 2: Test full flow
node test-full-review-flow.js

# Test 3: Xem tất cả orders
node debug-review-status.js
```

## ✅ KẾT QUẢ MONG ĐỢI

- ✅ User chỉ review 1 lần duy nhất
- ✅ Admin xóa → Order.reviewStatus = "review_deleted"
- ✅ User không thể review lại
- ✅ Nút "Đánh giá" TẮT sau khi admin xóa
- ✅ Admin không thấy reviews đã xóa
- ✅ Không có lỗi 404

## ⚠️ LƯU Ý

**PHẢI RESTART CẢ 2 BACKEND** sau khi sửa code!

Nếu vẫn lỗi, kiểm tra:
1. Backend đã restart chưa?
2. Frontend đã clear cache chưa?
3. Log backend có hiển thị "review_deleted" không?
4. Database có field reviewStatus chưa?
