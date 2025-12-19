import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  @Prop()
  website?: string;

  @Prop()
  country?: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Set the collection name to match the existing brands collection
BrandSchema.set('collection', 'brands');
