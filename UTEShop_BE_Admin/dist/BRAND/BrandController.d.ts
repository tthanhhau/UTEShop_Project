import { BrandService } from './BrandService';
import { CreateBrandDto } from './DTO/CreateBrandDto';
import { UpdateBrandDto } from './DTO/UpdateBrandDto';
export declare class BrandController {
    private readonly brandService;
    constructor(brandService: BrandService);
    getBrands(page?: string, limit?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/BrandSchema").BrandDocument, {}, {}> & import("../SCHEMAS/BrandSchema").Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    createBrand(createBrandDto: CreateBrandDto): Promise<import("mongoose").Document<unknown, {}, import("../SCHEMAS/BrandSchema").BrandDocument, {}, {}> & import("../SCHEMAS/BrandSchema").Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateBrand(id: string, updateBrandDto: UpdateBrandDto): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/BrandSchema").BrandDocument, {}, {}> & import("../SCHEMAS/BrandSchema").Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteBrand(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/BrandSchema").BrandDocument, {}, {}> & import("../SCHEMAS/BrandSchema").Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultipleBrands(ids: string[]): Promise<import("mongodb").DeleteResult>;
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        url: any;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        url?: undefined;
    }>;
}
