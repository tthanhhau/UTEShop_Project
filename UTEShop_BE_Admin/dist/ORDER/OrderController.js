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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const OrderService_1 = require("./OrderService");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let OrderController = class OrderController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    async getOrders(page, limit, status) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.orderService.findAll(pageNum, limitNum, status || '');
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async getOrderStats() {
        const stats = await this.orderService.getOrderStats();
        return {
            success: true,
            data: stats,
        };
    }
    async getOrderById(id) {
        const order = await this.orderService.findById(id);
        return {
            success: true,
            data: order,
        };
    }
    async updateOrderStatus(id, status) {
        const order = await this.orderService.updateStatus(id, status);
        return {
            success: true,
            data: order,
        };
    }
    async updatePaymentStatus(id, paymentStatus) {
        const order = await this.orderService.updatePaymentStatus(id, paymentStatus);
        return {
            success: true,
            data: order,
        };
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/payment-status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('paymentStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updatePaymentStatus", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('admin/orders'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [OrderService_1.OrderService])
], OrderController);
//# sourceMappingURL=OrderController.js.map