import { Document } from 'mongoose';
export type VoucherDocument = Voucher & Document;
export declare class Voucher {
    code: string;
    discountValue: number;
    discountType: string;
    minOrderAmount: number;
    maxDiscountAmount: number;
    startDate: Date;
    endDate: Date;
    maxIssued: number;
    usesCount: number;
    claimsCount: number;
    maxUsesPerUser: number;
    usersUsed: string[];
    isActive: boolean;
    description: string;
    rewardType: string;
}
export declare const VoucherSchema: import("mongoose").Schema<Voucher, import("mongoose").Model<Voucher, any, any, any, Document<unknown, any, Voucher, any, {}> & Voucher & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Voucher, Document<unknown, {}, import("mongoose").FlatRecord<Voucher>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Voucher> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
