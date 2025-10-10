import { Model } from 'mongoose';
import { Product, ProductDocument } from '../SCHEMAS/ProductSchema';
import { CreateProductDto } from './DTO/CreateProductDto';
import { UpdateProductDto } from './DTO/UpdateProductDto';
export declare class ProductService {
    private productModel;
    constructor(productModel: Model<ProductDocument>);
    findAll(page?: number, limit?: number, search?: string, category?: string, brand?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    create(createProductDto: CreateProductDto): Promise<import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    delete(id: string): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultiple(ids: string[]): Promise<import("mongodb").DeleteResult>;
}
