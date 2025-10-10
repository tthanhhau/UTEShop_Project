import { Model } from 'mongoose';
import { Voucher, VoucherDocument } from '../SCHEMAS/VoucherSchema';
export declare class VoucherService {
    private voucherModel;
    constructor(voucherModel: Model<VoucherDocument>);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, VoucherDocument, {}, {}> & Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, VoucherDocument, {}, {}> & Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    create(voucherData: any): Promise<import("mongoose").Document<unknown, {}, VoucherDocument, {}, {}> & Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, voucherData: any): Promise<(import("mongoose").Document<unknown, {}, VoucherDocument, {}, {}> & Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    delete(id: string): Promise<(import("mongoose").Document<unknown, {}, VoucherDocument, {}, {}> & Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getVoucherStats(): Promise<{
        totalVouchers: number;
        activeVouchers: number;
        expiredVouchers: number;
    }>;
}
