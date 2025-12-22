import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CustomerController } from '../customer/CustomerController';
import { CustomerService } from '../customer/CustomerService';
import { User, UserSchema } from '../schemas/UserSchema';
import { Order, OrderSchema } from '../schemas/OrderSchema';
import { ReturnRequest, ReturnRequestSchema } from '../return/return.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule { }
