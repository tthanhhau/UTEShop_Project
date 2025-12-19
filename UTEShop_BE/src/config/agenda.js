// config/agenda.js
import { Agenda } from 'agenda';
import Order from '../models/order.js';
import Notification from '../models/Notification.js';

// Hàm này sẽ được gọi từ server.js
export const initializeAgenda = (io, sendNotificationToUser) => {
    const mongoConnectionString = process.env.MONGODB_URI;

    const agenda = new Agenda({
        db: {
            address: mongoConnectionString,
            options: {
                family: 4, // ép IPv4, tránh ::1
                serverSelectionTimeoutMS: 5000
            }
        }
    });

    // Thêm event listeners cho Agenda
    agenda.on('ready', () => {
        console.log('✅ Agenda connected to MongoDB');
    });

    agenda.on('error', (error) => {
        console.error('❌ Agenda connection error:', error.message);
    });

    /**
     * Định nghĩa logic cho job 'process pending order'.
     * Bây giờ nó có thể truy cập vào `sendNotificationToUser`.
     */
    agenda.define('process pending order', async (job) => {
        const { orderId } = job.attrs.data;
        console.log(`Processing job for orderId: ${orderId}`);

        const order = await Order.findById(orderId);

        if (order && order.status === 'pending') {
            order.status = 'processing';
            await order.save();
            console.log(`✅ Order ${orderId} status updated to processing.`);
            const userId = order.user;
            sendNotificationToUser(io, userId, 'order_status_update', {
                orderId: order._id,
                newStatus: 'processing',
                message: `Đơn hàng #${order._id} của bạn đã bắt đầu được xử lý.`
            });
        }
    });

    /**
     * Job để gửi lại notification xác nhận giao hàng sau 2 phút
     * khi user chọn "Chưa nhận hàng"
     */
    agenda.define('resend delivery notification', async (job) => {
        const { orderId, userId } = job.attrs.data;
        console.log(`📬 Resending delivery notification for orderId: ${orderId}`);

        const order = await Order.findById(orderId);

        // Kiểm tra order vẫn còn ở trạng thái "shipped"
        if (order && order.status === 'shipped') {
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

            // Gửi notification qua WebSocket
            sendNotificationToUser(io, userId, 'new_notification', {
                ...newNotification.toObject(),
                orderId: order._id,
            });

            console.log(`✅ Reminder notification sent for order ${orderId}`);
        } else {
            console.log(`⚠️ Order ${orderId} is no longer in shipped status, skipping notification`);
        }
    });

    return agenda;
};