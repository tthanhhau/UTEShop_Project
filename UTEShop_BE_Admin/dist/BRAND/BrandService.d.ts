import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../SCHEMAS/BrandSchema';
import { CreateBrandDto } from './DTO/CreateBrandDto';
import { UpdateBrandDto } from './DTO/UpdateBrandDto';
export declare class BrandService {
    private brandModel;
    constructor(brandModel: Model<BrandDocument>);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, BrandDocument, {}, {}> & Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, BrandDocument, {}, {}> & Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    create(createBrandDto: CreateBrandDto): Promise<import("mongoose").Document<unknown, {}, BrandDocument, {}, {}> & Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateBrandDto: UpdateBrandDto): Promise<(import("mongoose").Document<unknown, {}, BrandDocument, {}, {}> & Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    delete(id: string): Promise<(import("mongoose").Document<unknown, {}, BrandDocument, {}, {}> & Brand & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultiple(ids: string[]): Promise<import("mongodb").DeleteResult>;
}
