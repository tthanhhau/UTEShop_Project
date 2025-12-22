import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './CategoryController';
import { CategoryService } from './CategoryService';
import { Category, CategorySchema } from '../schemas/CategorySchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule { }

