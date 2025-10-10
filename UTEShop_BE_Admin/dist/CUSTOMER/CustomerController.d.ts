import { CustomerService } from './CustomerService';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    getCustomers(page?: string, limit?: string, search?: string): Promise<{
        success: boolean;
        data: any[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    getCustomerStats(): Promise<{
        success: boolean;
        data: {
            totalCustomers: number;
            activeCustomers: number;
            inactiveCustomers: number;
        };
    }>;
    getCustomerOrders(id: string): Promise<{
        success: boolean;
        data: {
            customer: any;
            orders: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/OrderSchema").OrderDocument, {}, {}> & import("../SCHEMAS/OrderSchema").Order & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
                _id: unknown;
            }> & {
                __v: number;
            })[];
        };
    }>;
    getCustomerById(id: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/UserSchema").UserDocument, {}, {}> & import("../SCHEMAS/UserSchema").User & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    updateCustomerStatus(id: string, isActive: boolean): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/UserSchema").UserDocument, {}, {}> & import("../SCHEMAS/UserSchema").User & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
}
