import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../SCHEMAS/CategorySchema';
import { CreateCategoryDto } from './DTO/CreateCategoryDto';
import { UpdateCategoryDto } from './DTO/UpdateCategoryDto';
export declare class CategoryService {
    private categoryModel;
    constructor(categoryModel: Model<CategoryDocument>);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    create(createCategoryDto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<(import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    delete(id: string): Promise<(import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultiple(ids: string[]): Promise<import("mongodb").DeleteResult>;
}
