import { Document, Types } from 'mongoose';
export type PointTransactionDocument = PointTransaction & Document;
export declare class PointTransaction {
    user: Types.ObjectId;
    points: number;
    type: string;
    description: string;
    order: Types.ObjectId;
}
export declare const PointTransactionSchema: import("mongoose").Schema<PointTransaction, import("mongoose").Model<PointTransaction, any, any, any, Document<unknown, any, PointTransaction, any, {}> & PointTransaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PointTransaction, Document<unknown, {}, import("mongoose").FlatRecord<PointTransaction>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PointTransaction> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
