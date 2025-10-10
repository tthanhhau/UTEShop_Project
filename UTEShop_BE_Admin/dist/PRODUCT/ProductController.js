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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const ProductService_1 = require("./ProductService");
const CreateProductDto_1 = require("./DTO/CreateProductDto");
const UpdateProductDto_1 = require("./DTO/UpdateProductDto");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
let ProductController = class ProductController {
    ProductService;
    constructor(ProductService) {
        this.ProductService = ProductService;
    }
    async getProducts(page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.ProductService.findAll(pageNum, limitNum);
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async createProduct(createProductDto) {
        return this.ProductService.create(createProductDto);
    }
    async updateProduct(id, updateProductDto) {
        return this.ProductService.update(id, updateProductDto);
    }
    async deleteProduct(id) {
        return this.ProductService.delete(id);
    }
    async deleteMultipleProducts(ids) {
        return this.ProductService.deleteMultiple(ids);
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateProductDto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateProductDto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Delete)('multiple/delete'),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "deleteMultipleProducts", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)('admin/Products'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ProductService_1.ProductService])
], ProductController);
//# sourceMappingURL=ProductController.js.map