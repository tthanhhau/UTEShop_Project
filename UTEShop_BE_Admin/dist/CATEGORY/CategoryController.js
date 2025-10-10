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
exports.CategoryController = void 0;
const common_1 = require("@nestjs/common");
const CategoryService_1 = require("./CategoryService");
const CreateCategoryDto_1 = require("./DTO/CreateCategoryDto");
const UpdateCategoryDto_1 = require("./DTO/UpdateCategoryDto");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let CategoryController = class CategoryController {
    CategoryService;
    constructor(CategoryService) {
        this.CategoryService = CategoryService;
    }
    async getCategorys(page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.CategoryService.findAll(pageNum, limitNum);
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async createCategory(createCategoryDto) {
        return this.CategoryService.create(createCategoryDto);
    }
    async updateCategory(id, updateCategoryDto) {
        return this.CategoryService.update(id, updateCategoryDto);
    }
    async deleteCategory(id) {
        return this.CategoryService.delete(id);
    }
    async deleteMultipleCategorys(ids) {
        return this.CategoryService.deleteMultiple(ids);
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategorys", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCategoryDto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCategoryDto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Delete)('multiple/delete'),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "deleteMultipleCategorys", null);
exports.CategoryController = CategoryController = __decorate([
    (0, common_1.Controller)('admin/Categorys'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [CategoryService_1.CategoryService])
], CategoryController);
//# sourceMappingURL=CategoryController.js.map