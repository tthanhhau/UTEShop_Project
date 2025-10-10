import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandController } from './BrandController';
import { BrandService } from './BrandService';
import { Brand, BrandSchema } from '../SCHEMAS/BrandSchema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
  ],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
