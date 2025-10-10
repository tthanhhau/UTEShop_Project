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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ProductSchema_1 = require("../SCHEMAS/ProductSchema");
let ProductService = class ProductService {
    productModel;
    constructor(productModel) {
        this.productModel = productModel;
    }
    async findAll(page = 1, limit = 10, search = '', category = '', brand = '') {
        const skip = (page - 1) * limit;
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }
        if (brand) {
            query.brand = brand;
        }
        const [products, total] = await Promise.all([
            this.productModel
                .find(query)
                .populate('category')
                .populate('brand')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.productModel.countDocuments(query),
        ]);
        return {
            data: products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.productModel
            .findById(id)
            .populate('category')
            .populate('brand')
            .exec();
    }
    async create(createProductDto) {
        const product = new this.productModel(createProductDto);
        return product.save();
    }
    async update(id, updateProductDto) {
        return this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .populate('category')
            .populate('brand')
            .exec();
    }
    async delete(id) {
        return this.productModel.findByIdAndDelete(id).exec();
    }
    async deleteMultiple(ids) {
        return this.productModel.deleteMany({ _id: { $in: ids } }).exec();
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ProductSchema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProductService);
//# sourceMappingURL=ProductService.js.map