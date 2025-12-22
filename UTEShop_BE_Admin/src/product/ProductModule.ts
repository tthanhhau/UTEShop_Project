import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ProductController } from './ProductController';
import { ProductService } from './ProductService';
import { Product, ProductSchema } from '../schemas/ProductSchema';
import { Review, ReviewSchema } from '../schemas/ReviewSchema';
import { Order, OrderSchema } from '../schemas/OrderSchema';
import { ReturnRequest, ReturnRequestSchema } from '../return/return.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule { }

