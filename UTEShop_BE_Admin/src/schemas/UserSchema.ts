import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone?: string;

  @Prop({ default: 'customer' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: Object,
    default: { balance: 0, tier: 'BRONZE' },
  })
  loyaltyPoints?: {
    balance: number;
    tier: string;
  };

  @Prop({ type: [String], default: [] })
  voucherClaims?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
