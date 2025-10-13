import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from '../voucher/VoucherService';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('admin/vouchers')
@UseGuards(JwtAuthGuard)
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) { }

  @Get()
  async getVouchers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.voucherService.findAll(
      pageNum,
      limitNum,
      search || '',
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  async getVoucherStats() {
    const stats = await this.voucherService.getVoucherStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async getVoucherById(@Param('id') id: string) {
    const voucher = await this.voucherService.findById(id);
    return {
      success: true,
      data: voucher,
    };
  }

  @Post()
  async createVoucher(@Body() voucherData: any) {
    const voucher = await this.voucherService.create(voucherData);
    return {
      success: true,
      data: voucher,
    };
  }

  @Put(':id')
  async updateVoucher(@Param('id') id: string, @Body() voucherData: any) {
    const voucher = await this.voucherService.update(id, voucherData);
    return {
      success: true,
      data: voucher,
    };
  }

  @Delete(':id')
  async deleteVoucher(@Param('id') id: string) {
    await this.voucherService.delete(id);
    return {
      success: true,
      message: 'Voucher deleted successfully',
    };
  }
}




