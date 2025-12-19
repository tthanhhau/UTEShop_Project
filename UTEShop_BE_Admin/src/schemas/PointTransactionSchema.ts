import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PointTransactionDocument = PointTransaction & Document;

@Schema({ timestamps: true })
export class PointTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  type: string; // 'earn', 'redeem', 'expire'

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order: Types.ObjectId;
}

export const PointTransactionSchema =
  SchemaFactory.createForClass(PointTransaction);




