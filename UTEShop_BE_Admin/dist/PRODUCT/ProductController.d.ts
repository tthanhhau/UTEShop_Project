import { ProductService } from './ProductService';
import { CreateProductDto } from './DTO/CreateProductDto';
import { UpdateProductDto } from './DTO/UpdateProductDto';
export declare class ProductController {
    private readonly ProductService;
    constructor(ProductService: ProductService);
    getProducts(page?: string, limit?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/ProductSchema").ProductDocument, {}, {}> & import("../SCHEMAS/ProductSchema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    createProduct(createProductDto: CreateProductDto): Promise<import("mongoose").Document<unknown, {}, import("../SCHEMAS/ProductSchema").ProductDocument, {}, {}> & import("../SCHEMAS/ProductSchema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/ProductSchema").ProductDocument, {}, {}> & import("../SCHEMAS/ProductSchema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteProduct(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../SCHEMAS/ProductSchema").ProductDocument, {}, {}> & import("../SCHEMAS/ProductSchema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    deleteMultipleProducts(ids: string[]): Promise<import("mongodb").DeleteResult>;
}
