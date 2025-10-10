import { Model } from 'mongoose';
import { PointTransaction, PointTransactionDocument } from '../SCHEMAS/PointTransactionSchema';
export declare class PointsService {
    private pointTransactionModel;
    constructor(pointTransactionModel: Model<PointTransactionDocument>);
    findAll(page?: number, limit?: number, type?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, PointTransactionDocument, {}, {}> & PointTransaction & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
        totalTransactions: number;
        totalPointsEarned: any;
        totalPointsRedeemed: number;
    }>;
    getUserPoints(userId: string): Promise<{
        userId: string;
        totalPoints: number;
        transactions: (import("mongoose").Document<unknown, {}, PointTransactionDocument, {}, {}> & PointTransaction & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
}
