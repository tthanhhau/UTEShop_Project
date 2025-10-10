"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const OrderSchema_1 = require("../SCHEMAS/OrderSchema");
let OrderService = class OrderService {
    orderModel;
    constructor(orderModel) {
        this.orderModel = orderModel;
    }
    async findAll(page = 1, limit = 10, status = '') {
        const skip = (page - 1) * limit;
        const query = status ? { status } : {};
        const [orders, total] = await Promise.all([
            this.orderModel
                .find(query)
                .populate('user', 'name email')
                .populate('items.product', 'name price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.orderModel.countDocuments(query),
        ]);
        return {
            data: orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.orderModel
            .findById(id)
            .populate('user', 'name email phone')
            .populate('items.product', 'name price images')
            .exec();
    }
    async updateStatus(id, status) {
        return this.orderModel
            .findByIdAndUpdate(id, { status }, { new: true })
            .exec();
    }
    async updatePaymentStatus(id, paymentStatus) {
        return this.orderModel
            .findByIdAndUpdate(id, { paymentStatus }, { new: true })
            .exec();
    }
    async getOrderStats() {
        const totalOrders = await this.orderModel.countDocuments();
        const pendingOrders = await this.orderModel.countDocuments({
            status: 'pending',
        });
        const processingOrders = await this.orderModel.countDocuments({
            status: 'processing',
        });
        const deliveredOrders = await this.orderModel.countDocuments({
            status: 'delivered',
        });
        const cancelledOrders = await this.orderModel.countDocuments({
            status: 'cancelled',
        });
        const totalRevenueResult = await this.orderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const pendingRevenueResult = await this.orderModel.aggregate([
            { $match: { status: { $in: ['pending', 'processing'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const confirmedRevenueResult = await this.orderModel.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        return {
            totalOrders,
            pendingOrders,
            processingOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue: totalRevenueResult[0]?.total || 0,
            pendingRevenue: pendingRevenueResult[0]?.total || 0,
            confirmedRevenue: confirmedRevenueResult[0]?.total || 0,
        };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(OrderSchema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], OrderService);
//# sourceMappingURL=OrderService.js.map