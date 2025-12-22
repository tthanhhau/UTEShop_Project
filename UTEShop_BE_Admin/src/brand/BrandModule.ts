import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandController } from '../brand/BrandController';
import { BrandService } from '../brand/BrandService';
import { Brand, BrandSchema } from '../schemas/BrandSchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule { }
