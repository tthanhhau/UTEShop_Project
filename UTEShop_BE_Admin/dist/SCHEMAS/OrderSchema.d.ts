import { Document, Types } from 'mongoose';
export type OrderDocument = Order & Document;
export declare class Order {
    user: Types.ObjectId;
    items: Array<{
        product: Types.ObjectId;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    shippingAddress: string;
    deliveredAt?: Date;
}
export declare const OrderSchema: import("mongoose").Schema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order, any, {}> & Order & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Order> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
