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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const BrandService_1 = require("./BrandService");
const CreateBrandDto_1 = require("./DTO/CreateBrandDto");
const UpdateBrandDto_1 = require("./DTO/UpdateBrandDto");
const JwtAuthGuard_1 = require("../AUTH/GUARDS/JwtAuthGuard");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
let BrandController = class BrandController {
    brandService;
    constructor(brandService) {
        this.brandService = brandService;
    }
    async getBrands(page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const result = await this.brandService.findAll(pageNum, limitNum);
        return {
            success: true,
            data: result.data,
            pagination: result.pagination,
        };
    }
    async createBrand(createBrandDto) {
        return this.brandService.create(createBrandDto);
    }
    async updateBrand(id, updateBrandDto) {
        return this.brandService.update(id, updateBrandDto);
    }
    async deleteBrand(id) {
        return this.brandService.delete(id);
    }
    async deleteMultipleBrands(ids) {
        return this.brandService.deleteMultiple(ids);
    }
    async uploadImage(file) {
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_config_1.default.uploader.upload_stream({
                    folder: 'brands',
                    resource_type: 'image',
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                uploadStream.end(file.buffer);
            });
            return {
                success: true,
                url: result.secure_url,
            };
        }
        catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                message: 'Lỗi upload ảnh',
                error: error.message,
            };
        }
    }
};
exports.BrandController = BrandController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "getBrands", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateBrandDto_1.CreateBrandDto]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "createBrand", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateBrandDto_1.UpdateBrandDto]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "updateBrand", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "deleteBrand", null);
__decorate([
    (0, common_1.Delete)('multiple/delete'),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "deleteMultipleBrands", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandController.prototype, "uploadImage", null);
exports.BrandController = BrandController = __decorate([
    (0, common_1.Controller)('admin/brands'),
    (0, common_1.UseGuards)(JwtAuthGuard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [BrandService_1.BrandService])
], BrandController);
//# sourceMappingURL=BrandController.js.map