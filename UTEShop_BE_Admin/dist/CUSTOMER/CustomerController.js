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
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const CustomerService_1 = require("./CustomerService");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let CustomerController = class CustomerController {
    customerService;
    constructor(customerService) {
        this.customerService = customerService;
    }
    async getCustomers(page, limit, search) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.customerService.findAll(pageNum, limitNum, search || '');
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async getCustomerStats() {
        const stats = await this.customerService.getCustomerStats();
        return {
            success: true,
            data: stats,
        };
    }
    async getCustomerOrders(id) {
        const data = await this.customerService.getCustomerOrderHistory(id);
        return {
            success: true,
            data: data,
        };
    }
    async getCustomerById(id) {
        const customer = await this.customerService.findById(id);
        return {
            success: true,
            data: customer,
        };
    }
    async updateCustomerStatus(id, isActive) {
        const customer = await this.customerService.updateStatus(id, isActive);
        return {
            success: true,
            data: customer,
        };
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerStats", null);
__decorate([
    (0, common_1.Get)(':id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "updateCustomerStatus", null);
exports.CustomerController = CustomerController = __decorate([
    (0, common_1.Controller)('admin/customers'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [CustomerService_1.CustomerService])
], CustomerController);
//# sourceMappingURL=CustomerController.js.map