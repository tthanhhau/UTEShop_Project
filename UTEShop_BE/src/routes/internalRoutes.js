import express from 'express';
import { sendNotificationToUser } from '../config/socket.js';

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

export default router;

