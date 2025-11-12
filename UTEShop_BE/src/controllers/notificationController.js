import Notification from "../models/Notification.js";
import Order from "../models/order.js";

// Lấy danh sách thông báo, sắp xếp theo thời gian mới nhất
export const getNotifications = async (req, res) => {
    console.log("🔔 [getNotifications] ========== START ==========");
    console.log("🔔 [getNotifications] Request received");

    const userId = req.user?.id || req.user?._id;
    console.log("🔔 [getNotifications] User ID:", userId);
    console.log("🔔 [getNotifications] req.user:", req.user);
    console.log("🔔 [getNotifications] req.app.locals:", {
        hasIo: !!req.app?.locals?.io,
        hasSendNotificationToUser: !!req.app?.locals?.sendNotificationToUser
    });

    // Kiểm tra và tạo notification cho các đơn hàng "shipped" chưa có notification
    try {
        console.log("🔔 [getNotifications] Calling checkAndCreateShippedNotifications...");
        await checkAndCreateShippedNotifications(
            userId,
            req.app?.locals?.io,
            req.app?.locals?.sendNotificationToUser
        );
        console.log("🔔 [getNotifications] checkAndCreateShippedNotifications completed");
    } catch (error) {
        console.error("❌ [getNotifications] Error checking shipped notifications:", error);
        console.error("❌ [getNotifications] Error stack:", error.stack);
        // Không throw error, chỉ log để không ảnh hưởng đến việc lấy notifications
    }

    console.log("🔔 [getNotifications] Fetching notifications from database...");
    const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20); // Giới hạn 20 thông báo gần nhất

    console.log("🔔 [getNotifications] Found", notifications.length, "notifications");

    // (Tùy chọn) Lấy cả số lượng chưa đọc
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });
    console.log("🔔 [getNotifications] Unread count:", unreadCount);
    console.log("🔔 [getNotifications] ========== END ==========");

    res.status(200).json({ notifications, unreadCount });
};

// Hàm helper để kiểm tra và tạo notification cho các đơn hàng "shipped" chưa có notification
async function checkAndCreateShippedNotifications(userId, io, sendNotificationToUser) {
    console.log(`🔍 [checkAndCreateShippedNotifications] Starting check for user: ${userId}`);
    console.log(`🔍 [checkAndCreateShippedNotifications] User ID type: ${typeof userId}`);

    // Tìm tất cả đơn hàng "shipped" của user
    // Convert userId sang ObjectId nếu cần
    const mongoose = require('mongoose');
    let userIdQuery = userId;
    if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
        userIdQuery = new mongoose.Types.ObjectId(userId);
    }

    const shippedOrders = await Order.find({
        user: userIdQuery,
        status: "shipped"
    }).exec();

    console.log(`🔍 [checkAndCreateShippedNotifications] Found ${shippedOrders.length} shipped orders`);

    if (shippedOrders.length === 0) {
        console.log(`⚠️ [checkAndCreateShippedNotifications] No shipped orders found for user ${userId}`);
        return;
    }

    for (const order of shippedOrders) {
        console.log(`🔍 [checkAndCreateShippedNotifications] Processing order: ${order._id}, user: ${order.user}`);

        // Kiểm tra xem đã có notification cho đơn hàng này chưa
        const existingNotification = await Notification.findOne({
            user: userIdQuery,
            orderId: order._id,
            type: "order_delivery_confirmation",
        });

        if (!existingNotification) {
            console.log(`📦 [checkAndCreateShippedNotifications] Creating notification for shipped order ${order._id}`);

            // Tạo notification mới
            const notificationMessage = "Bạn đã nhận đơn hàng chưa?";
            const newNotification = new Notification({
                user: userId,
                message: notificationMessage,
                link: `/orders/tracking/${order._id}`,
                orderId: order._id,
                type: "order_delivery_confirmation",
                actions: {
                    confirm: "Xác nhận",
                    cancel: "Chưa nhận hàng",
                },
            });

            await newNotification.save();
            console.log(`✅ [checkAndCreateShippedNotifications] Notification created: ${newNotification._id}`);
            console.log(`✅ [checkAndCreateShippedNotifications] Notification data:`, JSON.stringify(newNotification.toObject(), null, 2));

            // Gửi notification qua WebSocket nếu có
            if (io && sendNotificationToUser) {
                try {
                    const notificationData = {
                        ...newNotification.toObject(),
                        orderId: order._id.toString(),
                    };
                    console.log(`📤 [checkAndCreateShippedNotifications] Sending via WebSocket:`, JSON.stringify(notificationData, null, 2));
                    await sendNotificationToUser(io, userId.toString(), "new_notification", notificationData);
                    console.log(`✅ [checkAndCreateShippedNotifications] Notification sent via WebSocket for order ${order._id}`);
                } catch (wsError) {
                    console.error(`❌ [checkAndCreateShippedNotifications] WebSocket error:`, wsError);
                    console.warn(`⚠️ Could not send WebSocket notification:`, wsError.message);
                }
            } else {
                console.warn(`⚠️ [checkAndCreateShippedNotifications] IO or sendNotificationToUser not available`);
            }
        } else {
            console.log(`ℹ️ [checkAndCreateShippedNotifications] Notification already exists for order ${order._id}: ${existingNotification._id}`);
        }
    }
}

// Đánh dấu tất cả thông báo là đã đọc
export const markNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;
    await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    res.status(200).json({ message: 'Notifications marked as read.' });
};

// Endpoint test để force tạo notification cho đơn hàng shipped (chỉ để debug)
export const testCreateShippedNotification = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        console.log(`🧪 [TEST] ========== START TEST ==========`);
        console.log(`🧪 [TEST] Force creating notification for user: ${userId}`);

        // Kiểm tra tất cả đơn hàng của user
        const mongoose = require('mongoose');
        let userIdQuery = userId;
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
            userIdQuery = new mongoose.Types.ObjectId(userId);
        }

        const allOrders = await Order.find({ user: userIdQuery }).select('_id status').exec();
        console.log(`🧪 [TEST] Total orders for user: ${allOrders.length}`);
        console.log(`🧪 [TEST] Orders by status:`, allOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {}));

        const shippedOrders = allOrders.filter(o => o.status === 'shipped');
        console.log(`🧪 [TEST] Shipped orders: ${shippedOrders.length}`);
        shippedOrders.forEach(order => {
            console.log(`🧪 [TEST]   - Order ${order._id}: ${order.status}`);
        });

        await checkAndCreateShippedNotifications(userId, req.app.locals.io, req.app.locals.sendNotificationToUser);

        // Lấy lại notifications sau khi tạo
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        const deliveryNotifications = notifications.filter(n => n.type === 'order_delivery_confirmation');
        console.log(`🧪 [TEST] Delivery confirmation notifications: ${deliveryNotifications.length}`);

        const unreadCount = await Notification.countDocuments({ user: userId, read: false });

        console.log(`🧪 [TEST] ========== END TEST ==========`);

        res.status(200).json({
            success: true,
            message: 'Test notification check completed',
            stats: {
                totalOrders: allOrders.length,
                shippedOrders: shippedOrders.length,
                totalNotifications: notifications.length,
                deliveryNotifications: deliveryNotifications.length,
                unreadCount
            },
            shippedOrders: shippedOrders.map(o => ({ _id: o._id, status: o.status })),
            deliveryNotifications: deliveryNotifications.map(n => ({
                _id: n._id,
                orderId: n.orderId,
                message: n.message,
                type: n.type
            })),
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('❌ [TEST] Error:', error);
        console.error('❌ [TEST] Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error creating test notification',
            error: error.message
        });
    }
};