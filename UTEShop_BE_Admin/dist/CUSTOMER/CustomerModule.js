"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const CustomerController_1 = require("./CustomerController");
const CustomerService_1 = require("./CustomerService");
const UserSchema_1 = require("../SCHEMAS/UserSchema");
const OrderSchema_1 = require("../SCHEMAS/OrderSchema");
let CustomerModule = class CustomerModule {
};
exports.CustomerModule = CustomerModule;
exports.CustomerModule = CustomerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema },
                { name: OrderSchema_1.Order.name, schema: OrderSchema_1.OrderSchema },
            ]),
        ],
        controllers: [CustomerController_1.CustomerController],
        providers: [CustomerService_1.CustomerService],
        exports: [CustomerService_1.CustomerService],
    })
], CustomerModule);
//# sourceMappingURL=CustomerModule.js.map