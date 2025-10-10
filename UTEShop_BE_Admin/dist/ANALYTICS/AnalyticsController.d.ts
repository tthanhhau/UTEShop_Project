import { AnalyticsService } from './AnalyticsService';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getGeneralStats(year?: string): Promise<{
        success: boolean;
        data: {
            totalRevenue: any;
            totalOrders: number;
            totalCustomers: number;
            totalProducts: number;
            growth: {
                revenue: string;
                orders: string;
                customers: string;
                products: string;
            };
        };
    }>;
    getRevenue(year?: string, type?: string): Promise<{
        success: boolean;
        data: any[];
        year: number;
        type: string;
    }>;
    getCompletedOrders(page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: any;
            orderCode: string;
            customer: any;
            customerEmail: any;
            products: any;
            totalProducts: any;
            total: any;
            paymentMethod: any;
            paymentStatus: any;
            date: any;
            shippingAddress: any;
        }[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    getNewCustomers(year?: string, type?: string): Promise<{
        success: boolean;
        data: any[];
        year: number;
        type: string;
    }>;
    getTopProducts(limit?: string): Promise<{
        success: boolean;
        data: {
            _id: any;
            name: any;
            originalPrice: any;
            discountedPrice: number;
            price: number;
            soldCount: any;
            sold: any;
            deliveredQuantity: any;
            revenue: any;
            category: any;
            brand: any;
            images: any;
            discountPercentage: any;
            stock: any;
            color: string;
        }[];
        limit: number;
    }>;
}
