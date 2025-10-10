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
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const AuthModule_1 = require("./AUTH/AuthModule");
const BrandModule_1 = require("./BRAND/BrandModule");
const CategoryModule_1 = require("./CATEGORY/CategoryModule");
const ProductModule_1 = require("./PRODUCT/ProductModule");
const OrderModule_1 = require("./ORDER/OrderModule");
const CustomerModule_1 = require("./CUSTOMER/CustomerModule");
const VoucherModule_1 = require("./VOUCHER/VoucherModule");
const PointsModule_1 = require("./POINTS/PointsModule");
const AnalyticsModule_1 = require("./ANALYTICS/AnalyticsModule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const uri = configService.get('MONGODB_URI') ||
                        configService.get('MONGO_URI') ||
                        'mongodb://127.0.0.1:27017/fashion_store';
                    console.log('🔗 Connecting to MongoDB:', uri);
                    return {
                        uri,
                        directConnection: true,
                        family: 4,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'your-secret-key',
                    signOptions: { expiresIn: '7d' },
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
    })
], AppModule);
//# sourceMappingURL=app.module.js.map