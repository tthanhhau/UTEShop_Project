import { PointsService } from './PointsService';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    getPointTransactions(page?: string, limit?: string, type?: string): Promise<{
        success: boolean;
        data: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/PointTransactionSchema").PointTransactionDocument, {}, {}> & import("../SCHEMAS/PointTransactionSchema").PointTransaction & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    getPointsStats(): Promise<{
        success: boolean;
        data: {
            totalTransactions: number;
            totalPointsEarned: any;
            totalPointsRedeemed: number;
        };
    }>;
    getUserPoints(userId: string): Promise<{
        success: boolean;
        data: {
            userId: string;
            totalPoints: number;
            transactions: (import("mongoose").Document<unknown, {}, import("../SCHEMAS/PointTransactionSchema").PointTransactionDocument, {}, {}> & import("../SCHEMAS/PointTransactionSchema").PointTransaction & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
                _id: unknown;
            }> & {
                __v: number;
            })[];
        };
    }>;
}
