import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './AnalyticsController';
import { AnalyticsService } from './AnalyticsService';
import { Order, OrderSchema } from '../schemas/OrderSchema';
import { User, UserSchema } from '../schemas/UserSchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
