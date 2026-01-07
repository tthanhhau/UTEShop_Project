import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brand: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true })
  stock: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({
    type: [{
      size: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 }
    }],
    default: []
  })
  sizes?: Array<{ size: string; stock: number }>;

  @Prop({ type: Array })
  variants?: Array<{
    size: string;
    stock: number;
    sku?: string;
  }>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Set the collection name to match the existing products collection
ProductSchema.set('collection', 'products');
