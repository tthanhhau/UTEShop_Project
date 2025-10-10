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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherSchema = exports.Voucher = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Voucher = class Voucher {
    code;
    discountValue;
    discountType;
    minOrderAmount;
    maxDiscountAmount;
    startDate;
    endDate;
    maxIssued;
    usesCount;
    claimsCount;
    maxUsesPerUser;
    usersUsed;
    isActive;
    description;
    rewardType;
};
exports.Voucher = Voucher;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Voucher.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Voucher.prototype, "discountValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'PERCENTAGE' }),
    __metadata("design:type", String)
], Voucher.prototype, "discountType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Voucher.prototype, "minOrderAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Voucher.prototype, "maxDiscountAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Voucher.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Voucher.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Voucher.prototype, "maxIssued", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Voucher.prototype, "usesCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Voucher.prototype, "claimsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Voucher.prototype, "maxUsesPerUser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Voucher.prototype, "usersUsed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Voucher.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Voucher.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'GENERAL' }),
    __metadata("design:type", String)
], Voucher.prototype, "rewardType", void 0);
exports.Voucher = Voucher = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Voucher);
exports.VoucherSchema = mongoose_1.SchemaFactory.createForClass(Voucher);
//# sourceMappingURL=VoucherSchema.js.map