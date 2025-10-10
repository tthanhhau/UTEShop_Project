"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const AuthController_1 = require("./AuthController");
const AuthService_1 = require("./AuthService");
const JwtStrategy_1 = require("./STRATEGIES/JwtStrategy");
const UserSchema_1 = require("../SCHEMAS/UserSchema");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            mongoose_1.MongooseModule.forFeature([{ name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema }]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'your-secret-key',
                    signOptions: { expiresIn: '7d' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [AuthController_1.AuthController],
        providers: [AuthService_1.AuthService, JwtStrategy_1.JwtStrategy],
        exports: [AuthService_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=AuthModule.js.map