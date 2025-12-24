import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoucherController } from '../voucher/VoucherController';
import { VoucherService } from '../voucher/VoucherService';
import { Voucher, VoucherSchema } from '../schemas/VoucherSchema';
import { UserVoucher, UserVoucherSchema } from '../schemas/UserVoucherSchema';
import { Order, OrderSchema } from '../schemas/OrderSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voucher.name, schema: VoucherSchema },
      { name: UserVoucher.name, schema: UserVoucherSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule { }




