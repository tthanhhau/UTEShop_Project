"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const AnalyticsController_1 = require("./AnalyticsController");
const AnalyticsService_1 = require("./AnalyticsService");
const OrderSchema_1 = require("../SCHEMAS/OrderSchema");
const UserSchema_1 = require("../SCHEMAS/UserSchema");
const ProductSchema_1 = require("../SCHEMAS/ProductSchema");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: OrderSchema_1.Order.name, schema: OrderSchema_1.OrderSchema },
                { name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema },
                { name: ProductSchema_1.Product.name, schema: ProductSchema_1.ProductSchema },
            ]),
        ],
        controllers: [AnalyticsController_1.AnalyticsController],
        providers: [AnalyticsService_1.AnalyticsService],
        exports: [AnalyticsService_1.AnalyticsService],
    })
], AnalyticsModule);
//# sourceMappingURL=AnalyticsModule.js.map