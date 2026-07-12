import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from '../order/OrderController';
import { OrderService } from '../order/OrderService';
import { Order, OrderSchema } from '../schemas/OrderSchema';
import { User, UserSchema } from '../schemas/UserSchema';
import { Product, ProductSchema } from '../schemas/ProductSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }




