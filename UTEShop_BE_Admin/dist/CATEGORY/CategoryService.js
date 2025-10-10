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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const CategorySchema_1 = require("../SCHEMAS/CategorySchema");
let CategoryService = class CategoryService {
    categoryModel;
    constructor(categoryModel) {
        this.categoryModel = categoryModel;
    }
    async findAll(page = 1, limit = 10, search = '') {
        const skip = (page - 1) * limit;
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const [categories, total] = await Promise.all([
            this.categoryModel.find(query).skip(skip).limit(limit).exec(),
            this.categoryModel.countDocuments(query),
        ]);
        return {
            data: categories,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.categoryModel.findById(id).exec();
    }
    async create(createCategoryDto) {
        const category = new this.categoryModel(createCategoryDto);
        return category.save();
    }
    async update(id, updateCategoryDto) {
        return this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();
    }
    async delete(id) {
        return this.categoryModel.findByIdAndDelete(id).exec();
    }
    async deleteMultiple(ids) {
        return this.categoryModel.deleteMany({ _id: { $in: ids } }).exec();
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(CategorySchema_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CategoryService);
//# sourceMappingURL=CategoryService.js.map