import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoucherController } from '../voucher/VoucherController';
import { VoucherService } from '../voucher/VoucherService';
import { Voucher, VoucherSchema } from '../schemas/VoucherSchema';
import { UserVoucher, UserVoucherSchema } from '../schemas/UserVoucherSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voucher.name, schema: VoucherSchema },
      { name: UserVoucher.name, schema: UserVoucherSchema },
    ]),
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
  exports: [VoucherService],
})
export class VoucherModule { }




