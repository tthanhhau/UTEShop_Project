import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number,
      },
    ],
  })
  items: Array<{
    product: Types.ObjectId;
    quantity: number;
    price: number;
  }>;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: 'unpaid' })
  paymentStatus: string;

  @Prop()
  paymentMethod: string;

  @Prop()
  shippingAddress: string;

  @Prop()
  deliveredAt?: Date;

  @Prop({ default: 0 })
  usedPoints?: number;

  @Prop({ default: 0 })
  usedPointsAmount?: number;

  @Prop({ default: 0 })
  voucherDiscount?: number;

  @Prop({ type: Types.ObjectId, ref: 'Voucher' })
  voucher?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
