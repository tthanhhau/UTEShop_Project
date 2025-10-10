import { Model } from 'mongoose';
import { Order, OrderDocument } from '../SCHEMAS/OrderSchema';
export declare class OrderService {
    private orderModel;
    constructor(orderModel: Model<OrderDocument>);
    findAll(page?: number, limit?: number, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    updateStatus(id: string, status: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    updatePaymentStatus(id: string, paymentStatus: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getOrderStats(): Promise<{
        totalOrders: number;
        pendingOrders: number;
        processingOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        totalRevenue: any;
        pendingRevenue: any;
        confirmedRevenue: any;
    }>;
}
