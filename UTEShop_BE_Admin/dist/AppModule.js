"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const AppController_1 = require("./AppController");
const AppService_1 = require("./AppService");
const BrandModule_1 = require("./BRAND/BrandModule");
const CategoryModule_1 = require("./CATEGORY/CategoryModule");
const ProductModule_1 = require("./PRODUCT/ProductModule");
const AnalyticsModule_1 = require("./ANALYTICS/AnalyticsModule");
const AuthModule_1 = require("./AUTH/AuthModule");
const OrderModule_1 = require("./ORDER/OrderModule");
const CustomerModule_1 = require("./CUSTOMER/CustomerModule");
const VoucherModule_1 = require("./VOUCHER/VoucherModule");
const PointsModule_1 = require("./POINTS/PointsModule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGODB_URI') ||
                        'mongodb://127.0.0.1:27017/fashion_store',
                    directConnection: true,
                    family: 4,
                }),
                inject: [config_1.ConfigService],
            }),
            AuthModule_1.AuthModule,
            BrandModule_1.BrandModule,
            CategoryModule_1.CategoryModule,
            ProductModule_1.ProductModule,
            OrderModule_1.OrderModule,
            CustomerModule_1.CustomerModule,
            VoucherModule_1.VoucherModule,
            PointsModule_1.PointsModule,
            AnalyticsModule_1.AnalyticsModule,
        ],
        controllers: [AppController_1.AppController],
        providers: [AppService_1.AppService],
    })
], AppModule);
//# sourceMappingURL=AppModule.js.map