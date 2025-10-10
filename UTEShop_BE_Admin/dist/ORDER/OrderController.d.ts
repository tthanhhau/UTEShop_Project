import { OrderService } from './OrderService';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    getOrders(page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/OrderSchema").OrderDocument, {}, {}> & import("../SCHEMAS/OrderSchema").Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    getOrderStats(): Promise<{
        success: boolean;
        data: {
            totalOrders: number;
            pendingOrders: number;
            processingOrders: number;
            deliveredOrders: number;
            cancelledOrders: number;
            totalRevenue: any;
            pendingRevenue: any;
            confirmedRevenue: any;
        };
    }>;
    getOrderById(id: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/OrderSchema").OrderDocument, {}, {}> & import("../SCHEMAS/OrderSchema").Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    updateOrderStatus(id: string, status: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/OrderSchema").OrderDocument, {}, {}> & import("../SCHEMAS/OrderSchema").Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    updatePaymentStatus(id: string, paymentStatus: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/OrderSchema").OrderDocument, {}, {}> & import("../SCHEMAS/OrderSchema").Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
}
