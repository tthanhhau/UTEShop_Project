import express from 'express';
import { sendNotificationToUser } from '../config/socket.js';
import Review from '../models/review.js';
import Order from '../models/order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const router = express.Router();

// Internal route để nhận request từ UTEShop_BE_Admin và gửi notification qua WebSocket
router.post('/notifications/send', async (req, res) => {
  console.log('📤 [INTERNAL] ========== RECEIVED REQUEST ==========');
  console.log('📤 [INTERNAL] Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { userId, notification } = req.body;
    const io = req.app.locals.io;
    const sendNotificationToUserFn = req.app.locals.sendNotificationToUser;

    console.log('📤 [INTERNAL] User ID:', userId);
    console.log('📤 [INTERNAL] Notification:', JSON.stringify(notification, null, 2));
    console.log('📤 [INTERNAL] IO available:', !!io);
    console.log('📤 [INTERNAL] sendNotificationToUserFn available:', !!sendNotificationToUserFn);

    if (!io || !sendNotificationToUserFn) {
      console.error('❌ [INTERNAL] Socket.IO not initialized');
      return res.status(500).json({
        success: false,
        message: 'Socket.IO not initialized',
      });
    }

    if (!userId || !notification) {
      console.error('❌ [INTERNAL] Missing userId or notification data');
      return res.status(400).json({
        success: false,
        message: 'Missing userId or notification data',
      });
    }

    console.log('📤 [INTERNAL] Sending notification to user:', userId);
    console.log('📤 [INTERNAL] Notification data:', JSON.stringify(notification, null, 2));

    await sendNotificationToUserFn(io, userId, 'new_notification', notification);

    console.log('✅ [INTERNAL] Notification sent successfully via WebSocket');
    console.log('📤 [INTERNAL] ========== REQUEST COMPLETED ==========');

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('❌ [INTERNAL] Error sending notification:', error);
    console.error('❌ [INTERNAL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
});

// Internal endpoint for admin to delete reviews
router.delete('/reviews/:reviewId', asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  console.log(`🗑️ [INTERNAL] Deleting review: ${reviewId}`);
  console.log(`🔍 [INTERNAL] Request headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔍 [INTERNAL] Request params:`, JSON.stringify(req.params, null, 2));

  // Kiểm tra review tồn tại trước khi xóa
  const existingReview = await Review.findById(reviewId);
  console.log(`🔍 [INTERNAL] Review exists:`, existingReview ? 'YES' : 'NO');
  if (existingReview) {
    console.log(`🔍 [INTERNAL] Review data:`, JSON.stringify(existingReview, null, 2));
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    console.log(`❌ [INTERNAL] Review not found: ${reviewId}`);
    return res.status(404).json({
      success: false,
      message: 'Review không tồn tại'
    });
  }

  // Soft delete: chỉ đánh dấu isDeleted = true
  review.isDeleted = true;
  review.deletedBy = req.user?.id || null; // nếu admin gửi user info
  review.deletedAt = new Date();
  await review.save();

  console.log(`✅ [INTERNAL] Review soft-deleted successfully: ${reviewId}`);

  // Cập nhật trạng thái review trong đơn hàng
  if (review.order) {
    await Order.findByIdAndUpdate(review.order, {
      reviewStatus: "review_deleted",
      reviewDeletedAt: new Date()
    });
    console.log(`✅ [INTERNAL] Order review status updated to 'review_deleted' for order: ${review.order}`);
  }


  console.log(`✅ [INTERNAL] Review deleted successfully: ${reviewId}`);
  console.log(`🔍 [INTERNAL] Deleted review data:`, JSON.stringify(review, null, 2));

  // Kiểm tra lại xem review đã thực sự bị xóa chưa
  const checkReview = await Review.findById(reviewId);
  console.log(`🔍 [INTERNAL] Review still exists after delete:`, checkReview ? 'YES' : 'NO');

  res.status(200).json({
    success: true,
    message: 'Xóa review thành công',
    deletedReview: review
  });
}));

// Internal endpoint for admin to delete reviews when product is deleted
router.delete('/reviews/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;

  console.log(`🗑️ [INTERNAL] Deleting all reviews for product: ${productId}`);
  console.log(`🔍 [INTERNAL] Request headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔍 [INTERNAL] Request params:`, JSON.stringify(req.params, null, 2));

  // Kiểm tra các review tồn tại trước khi xóa
  const existingReviews = await Review.find({ product: productId });
  console.log(`🔍 [INTERNAL] Found ${existingReviews.length} reviews for product: ${productId}`);
  if (existingReviews.length > 0) {
    console.log(`🔍 [INTERNAL] Sample review data:`, JSON.stringify(existingReviews[0], null, 2));
  }

  const result = await Review.deleteMany({ product: productId });

  console.log(`✅ [INTERNAL] Deleted ${result.deletedCount} reviews for product: ${productId}`);

  // Kiểm tra lại xem các review đã thực sự bị xóa chưa
  const checkReviews = await Review.find({ product: productId });
  console.log(`🔍 [INTERNAL] Reviews still exist after delete: ${checkReviews.length}`);

  res.status(200).json({
    success: true,
    message: `Đã xóa ${result.deletedCount} review của sản phẩm`,
    deletedCount: result.deletedCount
  });
}));

export default router;

