"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const PointsController_1 = require("./PointsController");
const PointsService_1 = require("./PointsService");
const PointTransactionSchema_1 = require("../SCHEMAS/PointTransactionSchema");
let PointsModule = class PointsModule {
};
exports.PointsModule = PointsModule;
exports.PointsModule = PointsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                {
                    name: PointTransactionSchema_1.PointTransaction.name,
                    schema: PointTransactionSchema_1.PointTransactionSchema,
                    collection: 'pointtransactions'
                },
            ]),
        ],
        controllers: [PointsController_1.PointsController],
        providers: [PointsService_1.PointsService],
        exports: [PointsService_1.PointsService],
    })
], PointsModule);
//# sourceMappingURL=PointsModule.js.map