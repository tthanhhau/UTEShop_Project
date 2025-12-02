import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
    @Prop({ required: true })
    user: string;

    @Prop({ required: true })
    product: string;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ maxlength: 500 })
    comment?: string;

    @Prop()
    order?: string;

    @Prop({ type: Object })
    adminReply?: {
        comment?: string;
        admin?: string;
        repliedAt?: Date;
    };

    @Prop({ default: false })
    isDeleted?: boolean;

    @Prop()
    deletedBy?: string;

    @Prop()
    deletedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Set the collection name to match the existing reviews collection
ReviewSchema.set('collection', 'reviews');