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
exports.BrandService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const BrandSchema_1 = require("../SCHEMAS/BrandSchema");
let BrandService = class BrandService {
    brandModel;
    constructor(brandModel) {
        this.brandModel = brandModel;
    }
    async findAll(page = 1, limit = 10, search = '') {
        const skip = (page - 1) * limit;
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const [brands, total] = await Promise.all([
            this.brandModel.find(query).skip(skip).limit(limit).exec(),
            this.brandModel.countDocuments(query),
        ]);
        return {
            data: brands,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.brandModel.findById(id).exec();
    }
    async create(createBrandDto) {
        const brand = new this.brandModel(createBrandDto);
        return brand.save();
    }
    async update(id, updateBrandDto) {
        return this.brandModel
            .findByIdAndUpdate(id, updateBrandDto, { new: true })
            .exec();
    }
    async delete(id) {
        return this.brandModel.findByIdAndDelete(id).exec();
    }
    async deleteMultiple(ids) {
        return this.brandModel.deleteMany({ _id: { $in: ids } }).exec();
    }
};
exports.BrandService = BrandService;
exports.BrandService = BrandService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(BrandSchema_1.Brand.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], BrandService);
//# sourceMappingURL=BrandService.js.map