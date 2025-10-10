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
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const PointsService_1 = require("./PointsService");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let PointsController = class PointsController {
    pointsService;
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    async getPointTransactions(page, limit, type) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.pointsService.findAll(pageNum, limitNum, type || '');
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async getPointsStats() {
        const stats = await this.pointsService.getPointsStats();
        return {
            success: true,
            data: stats,
        };
    }
    async getUserPoints(userId) {
        const data = await this.pointsService.getUserPoints(userId);
        return {
            success: true,
            data,
        };
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getPointTransactions", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getPointsStats", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PointsController.prototype, "getUserPoints", null);
exports.PointsController = PointsController = __decorate([
    (0, common_1.Controller)('admin/points'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [PointsService_1.PointsService])
], PointsController);
//# sourceMappingURL=PointsController.js.map