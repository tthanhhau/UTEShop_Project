import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserVoucherDocument = UserVoucher & Document;

@Schema({ 
  timestamps: true,
  collection: 'uservouchers' // Explicitly set collection name to match main backend
})
export class UserVoucher {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Voucher', required: true })
  voucher: Types.ObjectId;

  @Prop({ required: true })
  voucherCode: string;

  @Prop({ default: Date.now })
  claimedAt: Date;

  @Prop({ default: null })
  usedAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['REVIEW', 'ADMIN_GIFT', 'PROMOTION', 'LOYALTY', 'OTHER'],
    default: 'OTHER',
  })
  source: string;
}

export const UserVoucherSchema = SchemaFactory.createForClass(UserVoucher);

// Create indexes
UserVoucherSchema.index({ user: 1, voucher: 1 });
UserVoucherSchema.index({ user: 1, isUsed: 1 });

