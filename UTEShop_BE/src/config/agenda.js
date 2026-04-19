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
     * Tự động chuyển status sang "processing" và tạo đơn giao hàng với GHTK
     */
    agenda.define('process pending order', async (job) => {
        const { orderId } = job.attrs.data;
        console.log(`📦 Processing job for orderId: ${orderId}`);

        const order = await Order.findById(orderId)
            .populate('items.product')
            .populate('user');

        if (!order) {
            console.log(`❌ Order ${orderId} not found`);
            return;
        }

        if (order.status !== 'pending') {
            console.log(`⚠️ Order ${orderId} is not pending (status: ${order.status})`);
            return;
        }

        // Chuyển status sang processing
        order.status = 'processing';
        await order.save();
        console.log(`✅ Order ${orderId} status updated to processing`);

        // Gửi notification cho user
        const userId = order.user._id || order.user;
        sendNotificationToUser(io, userId, 'order_status_update', {
            orderId: order._id,
            newStatus: 'processing',
            message: `Đơn hàng #${order._id} của bạn đã bắt đầu được xử lý.`
        });

        // Tự động tạo đơn giao hàng nếu có thông tin shipping
        if (order.shippingInfo && order.shippingInfo.toDistrictId && order.shippingInfo.toWardCode) {
            console.log(`🚚 Creating shipping order for ${orderId}...`);
            console.log(`📋 Order shippingInfo:`, JSON.stringify(order.shippingInfo, null, 2));
            console.log(`📋 Order customerName:`, order.customerName);
            console.log(`📋 Order customerPhone:`, order.customerPhone);
            console.log(`📋 Order shippingAddress:`, order.shippingAddress);

            try {
                // Import shippingService
                const { default: shippingService } = await import('../services/shippingService.js');

                // Chuẩn bị dữ liệu tạo đơn
                const shippingData = {
                    orderId: order._id.toString(),
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    shippingAddress: order.shippingAddress,
                    toDistrictId: order.shippingInfo.toDistrictId,
                    toWardCode: order.shippingInfo.toWardCode,
                    province: order.shippingInfo.province,
                    district: order.shippingInfo.district,
                    ward: order.shippingInfo.ward,
                    items: order.items.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.price,
                        weight: item.product.weight || 500, // Mặc định 500g
                    })),
                    totalPrice: order.totalPrice,
                    codAmount: order.paymentMethod === 'COD' ? order.totalPrice : 0,
                    note: 'Giao hàng giờ hành chính',
                };

                console.log('📦 Shipping data prepared:', JSON.stringify(shippingData, null, 2));
                console.log('🔍 Checking address fields:');
                console.log('   - province:', shippingData.province, '(type:', typeof shippingData.province, ')');
                console.log('   - district:', shippingData.district, '(type:', typeof shippingData.district, ')');
                console.log('   - ward:', shippingData.ward, '(type:', typeof shippingData.ward, ')');

                if (!shippingService.hasRequiredShippingAddressIds(shippingData)) {
                    console.error('❌ Missing required shipping address IDs. Cannot create shipping order.');
                    console.error('   Required fields: toDistrictId and toWardCode');
                    return;
                }

                // Tạo đơn giao hàng với GHTK
                const shippingResult = await shippingService.createShippingOrder(
                    shippingData,
                    process.env.SHIPPING_PROVIDER || 'GHTK'
                );

                if (shippingResult.success) {
                    // Lưu thông tin vận đơn vào database
                    order.shippingInfo.trackingCode = shippingResult.trackingCode;
                    order.shippingInfo.provider = shippingResult.provider;
                    order.shippingInfo.createdAt = new Date();
                    order.shippingInfo.expectedDeliveryTime = shippingResult.expectedDeliveryTime || shippingResult.estimatedDeliverTime;
                    order.status = 'shipped'; // Chuyển sang shipped
                    await order.save();

                    console.log(`✅ Shipping order created: ${shippingResult.trackingCode}`);

                    // Gửi WebSocket event để frontend tự động cập nhật
                    sendNotificationToUser(io, userId, 'shipping_created', {
                        orderId: order._id,
                        trackingCode: shippingResult.trackingCode,
                        provider: shippingResult.provider,
                        newStatus: 'shipped',
                    });

                    // Gửi notification cho user về mã vận đơn
                    const trackingNotification = new Notification({
                        user: userId,
                        message: `Đơn hàng #${order._id} đã được giao cho đơn vị vận chuyển. Mã vận đơn: ${shippingResult.trackingCode}`,
                        link: `/orders/tracking/${order._id}`,
                        orderId: order._id,
                        type: 'order_shipped',
                    });
                    await trackingNotification.save();

                    sendNotificationToUser(io, userId, 'new_notification', trackingNotification.toObject());
                } else {
                    console.error(`❌ Failed to create shipping order: ${shippingResult.message || 'Unknown error'}`);
                }
            } catch (shippingError) {
                console.error(`❌ Error creating shipping order for ${orderId}:`, shippingError.message);
                // Không throw error để job không bị fail, order vẫn ở trạng thái processing
            }
        } else {
            console.log(`⚠️ Order ${orderId} missing shipping info, skipping shipping creation`);
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

    /**
     * Job để đồng bộ trạng thái vận đơn từ GHTK/GHN
     * Chạy định kỳ mỗi 30 phút để cập nhật trạng thái
     */
    agenda.define('sync shipping status', async (job) => {
        console.log(`🔄 Syncing shipping status...`);

        try {
            // Lấy tất cả đơn hàng đang shipped và có tracking code
            const shippedOrders = await Order.find({
                status: 'shipped',
                'shippingInfo.trackingCode': { $exists: true, $ne: null }
            }).limit(50); // Giới hạn 50 đơn mỗi lần để tránh quá tải

            console.log(`📦 Found ${shippedOrders.length} orders to sync`);

            const { default: shippingService } = await import('../services/shippingService.js');

            for (const order of shippedOrders) {
                try {
                    const trackingResult = await shippingService.trackOrder(
                        order.shippingInfo.trackingCode,
                        order.shippingInfo.provider
                    );

                    if (trackingResult.success) {
                        // Cập nhật trạng thái trong database
                        order.shippingInfo.status = trackingResult.status;

                        // Nếu đã giao hàng thành công, chuyển status sang delivered
                        if (trackingResult.status === 'delivered' || trackingResult.statusText?.includes('giao hàng')) {
                            order.status = 'delivered';
                            console.log(`✅ Order ${order._id} marked as delivered`);

                            // Gửi notification cho user
                            const deliveredNotification = new Notification({
                                user: order.user,
                                message: `Đơn hàng #${order._id} đã được giao thành công!`,
                                link: `/orders/tracking/${order._id}`,
                                orderId: order._id,
                                type: 'order_delivered',
                            });
                            await deliveredNotification.save();
                            sendNotificationToUser(io, order.user, 'new_notification', deliveredNotification.toObject());
                        }

                        await order.save();
                    }
                } catch (trackError) {
                    console.error(`❌ Error tracking order ${order._id}:`, trackError.message);
                }
            }

            console.log(`✅ Shipping status sync completed`);
        } catch (error) {
            console.error(`❌ Error in sync shipping status job:`, error.message);
        }
    });

    // Khởi động agenda và schedule các job định kỳ
    (async function () {
        await agenda.start();
        console.log('✅ Agenda started');

        // Schedule job đồng bộ trạng thái vận đơn mỗi 1 phút (cho demo)
        // Production nên dùng '30 minutes' hoặc '1 hour'
        await agenda.every('1 minute', 'sync shipping status');
        console.log('✅ Scheduled: sync shipping status every 1 minute');
    })();

    return agenda;
};