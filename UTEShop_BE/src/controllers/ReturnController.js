import ReturnRequest from "../models/returnRequest.js";
import Order from "../models/order.js";

// Tạo yêu cầu hoàn trả
export const createReturnRequest = async (req, res) => {
    try {
        const { orderId, reason, customReason } = req.body;
        const userId = req.user._id;

        // Kiểm tra đơn hàng tồn tại và thuộc về user
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Kiểm tra trạng thái đơn hàng phải là "delivered"
        if (order.status !== "delivered") {
            return res.status(400).json({
                message: "Chỉ có thể hoàn trả đơn hàng đã giao thành công"
            });
        }

        // Kiểm tra thời gian hoàn trả (trong vòng 24h kể từ khi giao)
        const deliveredTime = order.updatedAt;
        const now = new Date();
        const hoursDiff = (now - deliveredTime) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            return res.status(400).json({
                message: "Đã quá thời hạn hoàn trả (24 giờ kể từ khi nhận hàng)"
            });
        }

        // Kiểm tra đã có yêu cầu hoàn trả chưa
        const existingRequest = await ReturnRequest.findOne({
            order: orderId,
            status: { $in: ["pending", "approved"] }
        });
        if (existingRequest) {
            return res.status(400).json({
                message: "Đơn hàng này đã có yêu cầu hoàn trả"
            });
        }

        // Lấy text hiển thị cho reason
        const reasonMap = {
            wrong_item: "Giao sai sản phẩm",
            damaged: "Sản phẩm bị hư hỏng",
            not_as_described: "Không đúng mô tả",
            size_not_fit: "Size không vừa",
            quality_issue: "Chất lượng không tốt",
            changed_mind: "Đổi ý không muốn mua",
            other: "Lý do khác"
        };

        // Tạo yêu cầu hoàn trả
        const returnRequest = new ReturnRequest({
            order: orderId,
            user: userId,
            reason,
            reasonText: reasonMap[reason] || reason,
            customReason: reason === "other" ? customReason : "",
            refundAmount: order.totalPrice,
        });

        await returnRequest.save();

        res.status(201).json({
            message: "Yêu cầu hoàn trả đã được gửi thành công",
            returnRequest,
        });
    } catch (error) {
        console.error("Create return request error:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách yêu cầu hoàn trả của user
export const getUserReturnRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const returnRequests = await ReturnRequest.find({ user: userId })
            .populate({
                path: "order",
                populate: {
                    path: "items.product",
                    select: "name images price",
                },
            })
            .sort({ createdAt: -1 });

        res.json({ returnRequests });
    } catch (error) {
        console.error("Get user return requests error:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Kiểm tra đơn hàng có thể hoàn trả không
export const checkReturnEligibility = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.json({ canReturn: false, isReturned: false, reason: "Không tìm thấy đơn hàng" });
        }

        if (order.status !== "delivered") {
            return res.json({
                canReturn: false,
                isReturned: false,
                reason: "Đơn hàng chưa được giao"
            });
        }

        // Kiểm tra đã có yêu cầu hoàn trả được duyệt chưa
        const approvedRequest = await ReturnRequest.findOne({
            order: orderId,
            status: "approved"
        });
        if (approvedRequest) {
            return res.json({
                canReturn: false,
                isReturned: true, // Đã hoàn trả thành công
                reason: "Đơn hàng đã được hoàn trả",
                returnRequest: approvedRequest
            });
        }

        // Kiểm tra đã có yêu cầu hoàn trả đang chờ xử lý chưa
        const pendingRequest = await ReturnRequest.findOne({
            order: orderId,
            status: "pending"
        });
        if (pendingRequest) {
            return res.json({
                canReturn: false,
                isReturned: false,
                isPending: true,
                reason: "Đang chờ xử lý yêu cầu hoàn trả",
                returnRequest: pendingRequest
            });
        }

        // Kiểm tra thời gian
        const deliveredTime = order.updatedAt;
        const now = new Date();
        const hoursDiff = (now - deliveredTime) / (1000 * 60 * 60);
        const hoursRemaining = Math.max(0, 24 - hoursDiff);

        if (hoursDiff > 24) {
            return res.json({
                canReturn: false,
                isReturned: false,
                reason: "Đã quá thời hạn hoàn trả 24 giờ"
            });
        }

        res.json({
            canReturn: true,
            isReturned: false,
            hoursRemaining: Math.floor(hoursRemaining),
            minutesRemaining: Math.floor((hoursRemaining % 1) * 60)
        });
    } catch (error) {
        console.error("Check return eligibility error:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};
