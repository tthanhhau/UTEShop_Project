import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerController } from './CustomerController';
import { CustomerService } from './CustomerService';
import { User, UserSchema } from '../SCHEMAS/UserSchema';
import { Order, OrderSchema } from '../SCHEMAS/OrderSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
