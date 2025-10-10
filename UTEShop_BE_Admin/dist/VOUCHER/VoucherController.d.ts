import { VoucherService } from './VoucherService';
export declare class VoucherController {
    private readonly voucherService;
    constructor(voucherService: VoucherService);
    getVouchers(page?: string, limit?: string, search?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/VoucherSchema").VoucherDocument, {}, {}> & import("../SCHEMAS/VoucherSchema").Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    getVoucherStats(): Promise<{
        success: boolean;
        data: {
            totalVouchers: number;
            activeVouchers: number;
            expiredVouchers: number;
        };
    }>;
    getVoucherById(id: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/VoucherSchema").VoucherDocument, {}, {}> & import("../SCHEMAS/VoucherSchema").Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    createVoucher(voucherData: any): Promise<{
        success: boolean;
        data: import("mongoose").Document<unknown, {}, import("../SCHEMAS/VoucherSchema").VoucherDocument, {}, {}> & import("../SCHEMAS/VoucherSchema").Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
    updateVoucher(id: string, voucherData: any): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/VoucherSchema").VoucherDocument, {}, {}> & import("../SCHEMAS/VoucherSchema").Voucher & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    deleteVoucher(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
