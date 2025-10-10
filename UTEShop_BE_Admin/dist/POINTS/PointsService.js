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
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const PointTransactionSchema_1 = require("../SCHEMAS/PointTransactionSchema");
let PointsService = class PointsService {
    pointTransactionModel;
    constructor(pointTransactionModel) {
        this.pointTransactionModel = pointTransactionModel;
    }
    async findAll(page = 1, limit = 10, type = '') {
        const skip = (page - 1) * limit;
        const query = type ? { type } : {};
        const [transactions, total] = await Promise.all([
            this.pointTransactionModel
                .find(query)
                .populate('user', 'name email')
                .populate('order', '_id totalAmount')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.pointTransactionModel.countDocuments(query),
        ]);
        return {
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async getPointsStats() {
        const totalTransactions = await this.pointTransactionModel.countDocuments();
        const totalPointsEarned = await this.pointTransactionModel.aggregate([
            { $match: { type: { $in: ['EARNED', 'earn'] } } },
            { $group: { _id: null, total: { $sum: '$points' } } },
        ]);
        const totalPointsRedeemed = await this.pointTransactionModel.aggregate([
            { $match: { type: { $in: ['REDEEMED', 'redeem'] } } },
            { $group: { _id: null, total: { $sum: '$points' } } },
        ]);
        return {
            totalTransactions,
            totalPointsEarned: totalPointsEarned[0]?.total || 0,
            totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
        };
    }
    async getUserPoints(userId) {
        const transactions = await this.pointTransactionModel
            .find({ user: userId })
            .exec();
        const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);
        return {
            userId,
            totalPoints,
            transactions,
        };
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(PointTransactionSchema_1.PointTransaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PointsService);
//# sourceMappingURL=PointsService.js.map