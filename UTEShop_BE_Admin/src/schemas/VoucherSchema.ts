import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VoucherDocument = Voucher & Document;

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 'PERCENTAGE' })
  discountType: string;

  @Prop()
  minOrderAmount: number;

  @Prop()
  maxDiscountAmount: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 0 })
  maxIssued: number;

  @Prop({ default: 0 })
  usesCount: number;

  @Prop({ default: 0 })
  claimsCount: number;

  @Prop({ default: 1 })
  maxUsesPerUser: number;

  @Prop({ type: [String], default: [] })
  usersUsed: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop({ default: 'GENERAL' })
  rewardType: string;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);

