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
exports.VoucherService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const VoucherSchema_1 = require("../SCHEMAS/VoucherSchema");
let VoucherService = class VoucherService {
    voucherModel;
    constructor(voucherModel) {
        this.voucherModel = voucherModel;
    }
    async findAll(page = 1, limit = 10, search = '') {
        const skip = (page - 1) * limit;
        const query = search
            ? {
                $or: [
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
            }
            : {};
        const [vouchers, total] = await Promise.all([
            this.voucherModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.voucherModel.countDocuments(query),
        ]);
        return {
            data: vouchers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.voucherModel.findById(id).exec();
    }
    async create(voucherData) {
        const voucher = new this.voucherModel(voucherData);
        return voucher.save();
    }
    async update(id, voucherData) {
        return this.voucherModel
            .findByIdAndUpdate(id, voucherData, { new: true })
            .exec();
    }
    async delete(id) {
        return this.voucherModel.findByIdAndDelete(id).exec();
    }
    async getVoucherStats() {
        const totalVouchers = await this.voucherModel.countDocuments();
        const activeVouchers = await this.voucherModel.countDocuments({
            isActive: true,
            endDate: { $gte: new Date() },
        });
        const expiredVouchers = await this.voucherModel.countDocuments({
            endDate: { $lt: new Date() },
        });
        return {
            totalVouchers,
            activeVouchers,
            expiredVouchers,
        };
    }
};
exports.VoucherService = VoucherService;
exports.VoucherService = VoucherService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(VoucherSchema_1.Voucher.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], VoucherService);
//# sourceMappingURL=VoucherService.js.map