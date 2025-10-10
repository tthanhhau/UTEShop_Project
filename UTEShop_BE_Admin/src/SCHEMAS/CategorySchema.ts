import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
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

export const CategorySchema = SchemaFactory.createForClass(Category);
