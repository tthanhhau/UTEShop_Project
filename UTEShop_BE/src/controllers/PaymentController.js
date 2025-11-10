import { asyncHandler } from "../utils/asyncHandler.js";
import momoService from "../services/momoServices.js";
import Order from "../models/order.js";
import User from "../models/user.js";
import PointTransaction from "../models/PointTransaction.js";
import Configuration from "../models/Configuration.js";

class PaymentController {
    // Tạo payment request cho MoMo
    createPaymentRequest = asyncHandler(async (req, res) => {
        const { amount, orderInfo, orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid payment amount",
                code: "INVALID_AMOUNT",
            });
        }

        if (!orderInfo) {
            return res.status(400).json({
                message: "Order information is required",
                code: "MISSING_ORDER_INFO",
            });
        }

        // Tạo orderId nếu chưa có
        const finalOrderId = orderId || momoService.generateOrderId();

        const paymentData = {
            orderId: finalOrderId,
            amount: amount,
            orderInfo: orderInfo,
            extraData: JSON.stringify({
                userId: req.user._id.toString(),
                orderId: finalOrderId
            })
        };

        const result = await momoService.createPaymentRequest(paymentData);

        if (!result.success) {
            return res.status(400).json({
                message: "Failed to create payment request",
                error: result.error,
            });
        }

        // Cập nhật order với thông tin MoMo (nếu có orderId)
        if (orderId) {
            try {
                await Order.findByIdAndUpdate(orderId, {
                    'onlinePaymentInfo.transactionId': result.requestId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    paymentStatus: 'processing',
                });
            } catch (error) {
                console.error('Error updating order with MoMo info:', error);
            }
        }

        res.status(200).json({
            success: true,
            payUrl: result.payUrl,
            orderId: result.orderId,
            requestId: result.requestId,
            qrCodeUrl: result.qrCodeUrl,
        });
    });

    // Xác nhận thanh toán thành công (từ callback)
    confirmPayment = asyncHandler(async (req, res) => {
        const { orderId, requestId } = req.body;

        if (!orderId || !requestId) {
            return res.status(400).json({
                message: "Order ID and Request ID are required",
                code: "MISSING_PARAMETERS",
            });
        }

        const result = await momoService.queryTransaction(orderId, requestId);

        if (!result.success) {
            return res.status(400).json({
                message: "Failed to query payment status",
                error: result.error,
            });
        }

        const { data } = result;
        const isSuccess = data.resultCode === '0';

        // Cập nhật trạng thái order
        if (isSuccess && orderId) {
            try {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'paid',
                    'onlinePaymentInfo.transactionId': data.transId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    'onlinePaymentInfo.paidAt': new Date(),
                    'onlinePaymentInfo.amount': data.amount,
                });
            } catch (error) {
                console.error('Error updating order payment status:', error);
            }
        }

        res.status(200).json({
            success: true,
            isPaid: isSuccess,
            message: data.message,
            transactionId: data.transId,
        });
    });

    // Hủy thanh toán
    cancelPayment = asyncHandler(async (req, res) => {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required",
                code: "MISSING_ORDER_ID",
            });
        }

        try {
            // Lấy thông tin đơn hàng để xác định phương thức thanh toán và số tiền
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "ORDER_NOT_FOUND",
                });
            }

            // Cập nhật trạng thái order về hủy thanh toán
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'unpaid',
                status: 'cancelled',
            });

            // Nếu đơn hàng thanh toán bằng MOMO thì chuyển số tiền thành điểm tích lũy
            // Tránh cộng điểm trùng nếu đã chuyển trước đó
            let pointsConversionPerformed = false;
            let pointsAwarded = 0;
            let convertedAmount = 0;

            if (String(order.paymentMethod) === "MOMO") {
                // Kiểm tra đã có giao dịch EARNED cho đơn này với mô tả chuyển đổi MOMO chưa
                const existingConversion = await PointTransaction.findOne({
                    user: order.user,
                    order: order._id,
                    type: "EARNED",
                    description: { $regex: '^MOMO_CANCEL_CONVERT', $options: 'i' }
                });

                if (!existingConversion) {
                    // Lấy cấu hình quy đổi điểm
                    const configDoc = await Configuration.findOne({ key: 'points_config' });
                    const config = configDoc?.value || {
                        pointsValue: 1, // 1 VND = 1 point (1000 VND = 1000 points)
                        silverThreshold: 1000,
                        goldThreshold: 5000,
                        pointsPerOrder: 1
                    };

                    const calculateTier = (pointsBalance) => {
                        if (pointsBalance >= config.goldThreshold) return 'GOLD';
                        if (pointsBalance >= config.silverThreshold) return 'SILVER';
                        return 'BRONZE';
                    };

                    // Số tiền để chuyển đổi: dùng tổng tiền cuối cùng của đơn hàng
                    convertedAmount = order.totalPrice || 0;

                    // Tính điểm được cộng
                    pointsAwarded = Math.floor(convertedAmount / config.pointsValue);

                    if (pointsAwarded > 0) {
                        // Tạo bản ghi lịch sử điểm
                        await PointTransaction.create({
                            user: order.user,
                            type: "EARNED",
                            points: pointsAwarded,
                            description: `MOMO_CANCEL_CONVERT: Chuyển đổi ${convertedAmount} VND thành ${pointsAwarded} điểm tích lũy (đơn ${order._id})`,
                            order: order._id
                        });

                        // Cập nhật số dư điểm và hạng thành viên của user
                        const user = await User.findById(order.user);
                        if (user) {
                            const newBalance = (user.loyaltyPoints?.balance || 0) + pointsAwarded;
                            user.loyaltyPoints.balance = newBalance;
                            user.loyaltyPoints.tier = calculateTier(newBalance);
                            await user.save();
                            pointsConversionPerformed = true;
                        }
                    }
                }
            }

            if (pointsConversionPerformed) {
                return res.status(200).json({
                    success: true,
                    message: "Payment cancelled and amount converted to loyalty points",
                    pointsAwarded,
                    convertedAmount,
                });
            }

            // Nếu không đủ điều kiện chuyển điểm hoặc đã chuyển trước đó, trả về trạng thái hủy bình thường
            return res.status(200).json({
                success: true,
                message: "Payment cancelled successfully",
            });
        } catch (error) {
            console.error('Error cancelling payment or converting to points:', error);
            return res.status(400).json({
                message: "Failed to cancel payment",
                error: error.message,
            });
        }
    });

    // Webhook để xử lý callback từ MoMo
    handleMoMoWebhook = asyncHandler(async (req, res) => {
        try {
            const callbackData = req.body;

            // Xác minh callback
            const verification = momoService.verifyCallback(callbackData);

            if (!verification.isValid) {
                return res.status(400).json({
                    message: "Invalid callback signature",
                });
            }

            // Xử lý kết quả thanh toán
            if (verification.isSuccess) {
                await this.handleMoMoPaymentSuccess(verification);
            } else {
                await this.handleMoMoPaymentFailed(verification);
            }

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('MoMo Webhook Error:', error);
            res.status(400).json({
                message: "Webhook processing failed",
                error: error.message,
            });
        }
    });

    // Xử lý thanh toán MoMo thành công
    async handleMoMoPaymentSuccess(verification) {
        try {
            const { orderId, transId, amount } = verification;

            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    paymentStatus: 'paid',
                    'onlinePaymentInfo.transactionId': transId,
                    'onlinePaymentInfo.gateway': 'MOMO',
                    'onlinePaymentInfo.paidAt': new Date(),
                    'onlinePaymentInfo.amount': amount,
                });

                console.log(`MoMo payment succeeded for order ${orderId}, transaction ${transId}`);
            }
        } catch (error) {
            console.error('Error handling MoMo payment success:', error);
        }
    }

    // Xử lý thanh toán MoMo thất bại
    async handleMoMoPaymentFailed(verification) {
        try {
            const { orderId } = verification;

            if (!orderId) return;

            // Lấy đơn hàng để biết user, phương thức và tổng tiền
            const order = await Order.findById(orderId);
            if (!order) {
                console.warn(`MoMo payment failed but order not found: ${orderId}`);
                return;
            }

            // Cập nhật trạng thái đơn
            await Order.findByIdAndUpdate(orderId, {
                paymentStatus: 'unpaid',
                status: 'cancelled',
            });

            // Chỉ chuyển thành điểm nếu đơn là thanh toán MOMO
            if (String(order.paymentMethod) === "MOMO") {
                // Tránh cộng trùng: kiểm tra đã có giao dịch quy đổi cho đơn này chưa
                const existingConversion = await PointTransaction.findOne({
                    user: order.user,
                    order: order._id,
                    type: "EARNED",
                    description: { $regex: '^MOMO_CANCEL_CONVERT', $options: 'i' }
                });

                if (!existingConversion) {
                    // Lấy cấu hình quy đổi điểm
                    const configDoc = await Configuration.findOne({ key: 'points_config' });
                    const config = configDoc?.value || {
                        pointsValue: 1, // 1 VND = 1 điểm (1000 VND = 1000 điểm)
                        silverThreshold: 1000,
                        goldThreshold: 5000,
                        pointsPerOrder: 1
                    };

                    const calculateTier = (pointsBalance) => {
                        if (pointsBalance >= config.goldThreshold) return 'GOLD';
                        if (pointsBalance >= config.silverThreshold) return 'SILVER';
                        return 'BRONZE';
                    };

                    // Số tiền được quy đổi là tổng tiền phải trả của đơn
                    const convertedAmount = order.totalPrice || 0;
                    const pointsAwarded = Math.floor(convertedAmount / config.pointsValue);

                    if (pointsAwarded > 0) {
                        // Lưu lịch sử điểm
                        await PointTransaction.create({
                            user: order.user,
                            type: "EARNED",
                            points: pointsAwarded,
                            description: `MOMO_CANCEL_CONVERT: Chuyển đổi ${convertedAmount} VND thành ${pointsAwarded} điểm tích lũy (đơn ${order._id})`,
                            order: order._id
                        });

                        // Cập nhật số dư điểm + tier của user
                        const user = await User.findById(order.user);
                        if (user) {
                            const newBalance = (user.loyaltyPoints?.balance || 0) + pointsAwarded;
                            user.loyaltyPoints.balance = newBalance;
                            user.loyaltyPoints.tier = calculateTier(newBalance);
                            await user.save();
                        }
                    }
                }
            }

            console.log(`MoMo payment failed for order ${orderId} and converted amount to points if applicable`);
        } catch (error) {
            console.error('Error handling MoMo payment failure:', error);
        }
    }
}

export default new PaymentController();
