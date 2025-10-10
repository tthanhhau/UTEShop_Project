"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const VoucherController_1 = require("./VoucherController");
const VoucherService_1 = require("./VoucherService");
const VoucherSchema_1 = require("../SCHEMAS/VoucherSchema");
let VoucherModule = class VoucherModule {
};
exports.VoucherModule = VoucherModule;
exports.VoucherModule = VoucherModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: VoucherSchema_1.Voucher.name, schema: VoucherSchema_1.VoucherSchema }]),
        ],
        controllers: [VoucherController_1.VoucherController],
        providers: [VoucherService_1.VoucherService],
        exports: [VoucherService_1.VoucherService],
    })
], VoucherModule);
//# sourceMappingURL=VoucherModule.js.map