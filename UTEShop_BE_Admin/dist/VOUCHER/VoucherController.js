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
exports.VoucherController = void 0;
const common_1 = require("@nestjs/common");
const VoucherService_1 = require("./VoucherService");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let VoucherController = class VoucherController {
    voucherService;
    constructor(voucherService) {
        this.voucherService = voucherService;
    }
    async getVouchers(page, limit, search) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.voucherService.findAll(pageNum, limitNum, search || '');
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async getVoucherStats() {
        const stats = await this.voucherService.getVoucherStats();
        return {
            success: true,
            data: stats,
        };
    }
    async getVoucherById(id) {
        const voucher = await this.voucherService.findById(id);
        return {
            success: true,
            data: voucher,
        };
    }
    async createVoucher(voucherData) {
        const voucher = await this.voucherService.create(voucherData);
        return {
            success: true,
            data: voucher,
        };
    }
    async updateVoucher(id, voucherData) {
        const voucher = await this.voucherService.update(id, voucherData);
        return {
            success: true,
            data: voucher,
        };
    }
    async deleteVoucher(id) {
        await this.voucherService.delete(id);
        return {
            success: true,
            message: 'Voucher deleted successfully',
        };
    }
};
exports.VoucherController = VoucherController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "getVouchers", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "getVoucherStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "getVoucherById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "createVoucher", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "updateVoucher", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "deleteVoucher", null);
exports.VoucherController = VoucherController = __decorate([
    (0, common_1.Controller)('admin/vouchers'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [VoucherService_1.VoucherService])
], VoucherController);
//# sourceMappingURL=VoucherController.js.map