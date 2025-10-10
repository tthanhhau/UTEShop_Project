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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const AnalyticsService_1 = require("./AnalyticsService");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getGeneralStats(year) {
        const yearNum = year ? parseInt(year) : new Date().getFullYear();
        return this.analyticsService.getGeneralStats(yearNum);
    }
    async getRevenue(year, type) {
        const yearNum = year ? parseInt(year) : new Date().getFullYear();
        return this.analyticsService.getRevenue(yearNum, type || 'monthly');
    }
    async getCompletedOrders(page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getCompletedOrders(pageNum, limitNum);
    }
    async getNewCustomers(year, type) {
        const yearNum = year ? parseInt(year) : new Date().getFullYear();
        return this.analyticsService.getNewCustomers(yearNum, type || 'monthly');
    }
    async getTopProducts(limit) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getTopProducts(limitNum);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('general-stats'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getGeneralStats", null);
__decorate([
    (0, common_1.Get)('revenue'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('completed-orders'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCompletedOrders", null);
__decorate([
    (0, common_1.Get)('new-customers'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getNewCustomers", null);
__decorate([
    (0, common_1.Get)('top-products'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopProducts", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('admin/analytics'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [AnalyticsService_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=AnalyticsController.js.map