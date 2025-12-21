import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReturnRequestDocument = ReturnRequest & Document;

@Schema({ timestamps: true })
export class ReturnRequest {
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    order: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({
        type: String,
        enum: [
            'wrong_item',
            'damaged',
            'not_as_described',
            'size_not_fit',
            'quality_issue',
            'changed_mind',
            'other',
        ],
        required: true,
    })
    reason: string;

    @Prop({ type: String, default: '' })
    reasonText: string;

    @Prop({ type: String, default: '' })
    customReason: string;

    @Prop({
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    })
    status: string;

    @Prop({ type: Number, required: true })
    refundAmount: number;

    @Prop({ type: Number, default: 0 })
    pointsAwarded: number;

    @Prop({ type: String, default: '' })
    adminNote: string;

    @Prop({ type: Date })
    processedAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    processedBy: Types.ObjectId;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
