import { asyncHandler } from "../utils/asyncHandler.js";
import shippingService from "../services/shippingService.js";
import Order from "../models/order.js";

class ShippingController {
    /**
     * Tính phí vận chuyển
     */
    calculateFee = asyncHandler(async (req, res) => {
        const { toDistrictId, toWardCode, province, district, ward, weight, insuranceValue, provider } = req.body;

        if (!shippingService.hasRequiredShippingAddressIds({ toDistrictId, toWardCode })) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: toDistrictId, toWardCode",
            });
        }

        const result = await shippingService.calculateShippingFee(
            {
                toDistrictId,
                toWardCode,
                province,
                district,
                ward,
                weight,
                insuranceValue,
            },
            provider
        );

        res.status(200).json(result);
    });

    /**
     * Tạo đơn giao hàng
     */
    createShippingOrder = asyncHandler(async (req, res) => {
        const { orderId, provider } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        // Lấy thông tin đơn hàng
        const order = await Order.findById(orderId).populate("items.product");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Kiểm tra đơn hàng đã có mã vận đơn chưa
        if (order.shippingInfo && order.shippingInfo.trackingCode) {
            return res.status(400).json({
                success: false,
                message: "Shipping order already created for this order",
                trackingCode: order.shippingInfo.trackingCode,
            });
        }

        // Chuẩn bị dữ liệu tạo đơn
        const resolvedToDistrictId = req.body.toDistrictId || order.shippingInfo?.toDistrictId;
        const resolvedToWardCode = req.body.toWardCode || order.shippingInfo?.toWardCode;

        if (!shippingService.hasRequiredShippingAddressIds({
            toDistrictId: resolvedToDistrictId,
            toWardCode: resolvedToWardCode,
        })) {
            return res.status(400).json({
                success: false,
                message: "Missing required shipping address IDs on request/order: toDistrictId, toWardCode",
            });
        }

        const orderData = {
            orderId: order._id.toString(),
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            toDistrictId: resolvedToDistrictId,
            toWardCode: resolvedToWardCode,
            province: req.body.province || order.shippingInfo?.province,
            district: req.body.district || order.shippingInfo?.district,
            ward: req.body.ward || order.shippingInfo?.ward,
            items: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                weight: item.product.weight || 500,
            })),
            totalPrice: order.totalPrice,
            codAmount: order.paymentMethod === 'COD' ? order.totalPrice : 0,
            note: req.body.note || '',
        };

        // Tạo đơn giao hàng
        const result = await shippingService.createShippingOrder(orderData, provider);

        // Cập nhật thông tin vận chuyển vào order
        order.shippingInfo = {
            provider: result.provider,
            trackingCode: result.trackingCode,
            shippingFee: result.totalFee || result.fee,
            expectedDeliveryTime: result.expectedDeliveryTime || result.estimatedDeliverTime,
            createdAt: new Date(),
        };

        await order.save();

        res.status(200).json({
            success: true,
            message: "Shipping order created successfully",
            order: order,
            shipping: result,
        });
    });

    /**
     * Tra cứu trạng thái vận đơn
     */
    trackOrder = asyncHandler(async (req, res) => {
        const { trackingCode, provider } = req.query;

        if (!trackingCode) {
            return res.status(400).json({
                success: false,
                message: "Tracking code is required",
            });
        }

        const result = await shippingService.trackOrder(trackingCode, provider);

        res.status(200).json(result);
    });

    /**
     * Tra cứu theo Order ID
     */
    trackByOrderId = asyncHandler(async (req, res) => {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (!order.shippingInfo || !order.shippingInfo.trackingCode) {
            return res.status(400).json({
                success: false,
                message: "No shipping information found for this order",
            });
        }

        const result = await shippingService.trackOrder(
            order.shippingInfo.trackingCode,
            order.shippingInfo.provider
        );

        await order.save();

        res.status(200).json({
            success: true,
            order: {
                _id: order._id,
                status: order.status,
                customerName: order.customerName,
                shippingAddress: order.shippingAddress,
                shippingInfo: order.shippingInfo,
            },
            shipping: result,
        });
    });

    /**
     * Hủy đơn giao hàng
     */
    cancelShippingOrder = asyncHandler(async (req, res) => {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (!order.shippingInfo || !order.shippingInfo.trackingCode) {
            return res.status(400).json({
                success: false,
                message: "No shipping information found for this order",
            });
        }

        const result = await shippingService.cancelShippingOrder(
            order.shippingInfo.trackingCode,
            order.shippingInfo.provider
        );

        // Cập nhật trạng thái
        order.shippingInfo.status = 'cancelled';
        order.shippingInfo.cancelledAt = new Date();
        await order.save();

        res.status(200).json({
            success: true,
            message: "Shipping order cancelled successfully",
            result,
        });
    });

    /**
     * Lấy danh sách tỉnh/thành phố
     * Luôn dùng GHN cho master data
     */
    getProvinces = asyncHandler(async (req, res) => {
        const provinces = await shippingService.getProvinces();

        res.status(200).json({
            success: true,
            data: provinces,
        });
    });

    /**
     * Lấy danh sách quận/huyện
     * Luôn dùng GHN cho master data
     */
    getDistricts = asyncHandler(async (req, res) => {
        const { provinceId } = req.query;

        if (!provinceId) {
            return res.status(400).json({
                success: false,
                message: "Province ID is required",
            });
        }

        const districts = await shippingService.getDistricts(provinceId);

        res.status(200).json({
            success: true,
            data: districts,
        });
    });

    /**
     * Lấy danh sách phường/xã
     * Luôn dùng GHN cho master data
     */
    getWards = asyncHandler(async (req, res) => {
        const { districtId } = req.query;

        if (!districtId) {
            return res.status(400).json({
                success: false,
                message: "District ID is required",
            });
        }

        const wards = await shippingService.getWards(districtId);

        res.status(200).json({
            success: true,
            data: wards,
        });
    });
}

export default new ShippingController();
