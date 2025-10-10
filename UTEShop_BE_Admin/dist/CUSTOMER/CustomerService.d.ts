import { Model } from 'mongoose';
import { User, UserDocument } from '../SCHEMAS/UserSchema';
import { Order, OrderDocument } from '../SCHEMAS/OrderSchema';
export declare class CustomerService {
    private userModel;
    private orderModel;
    constructor(userModel: Model<UserDocument>, orderModel: Model<OrderDocument>);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: any[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    findById(id: string): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getCustomerStats(): Promise<{
        totalCustomers: number;
        activeCustomers: number;
        inactiveCustomers: number;
    }>;
    updateStatus(id: string, isActive: boolean): Promise<(import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getCustomerOrderHistory(customerId: string): Promise<{
        customer: any;
        orders: (import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
}
