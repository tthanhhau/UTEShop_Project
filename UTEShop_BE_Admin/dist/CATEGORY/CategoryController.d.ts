import { CategoryService } from './CategoryService';
import { CreateCategoryDto } from './DTO/CreateCategoryDto';
import { UpdateCategoryDto } from './DTO/UpdateCategoryDto';
export declare class CategoryController {
    private readonly CategoryService;
    constructor(CategoryService: CategoryService);
    getCategorys(page?: string, limit?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/CategorySchema").CategoryDocument, {}, {}> & import("../SCHEMAS/CategorySchema").Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    createCategory(createCategoryDto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../SCHEMAS/CategorySchema").CategoryDocument, {}, {}> & import("../SCHEMAS/CategorySchema").Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/CategorySchema").CategoryDocument, {}, {}> & import("../SCHEMAS/CategorySchema").Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteCategory(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/CategorySchema").CategoryDocument, {}, {}> & import("../SCHEMAS/CategorySchema").Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultipleCategorys(ids: string[]): Promise<import("mongodb").DeleteResult>;
}
