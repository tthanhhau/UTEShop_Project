import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './OrderService';
import { JwtAuthGuard } from '../AUTH/GUARDS/JwtAuthGuard';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.orderService.findAll(
      pageNum,
      limitNum,
      status || '',
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  async getOrderStats() {
    const stats = await this.orderService.getOrderStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.findById(id);
    return {
      success: true,
      data: order,
    };
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const order = await this.orderService.updateStatus(id, status);
    return {
      success: true,
      data: order,
    };
  }

  @Put(':id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    const order = await this.orderService.updatePaymentStatus(
      id,
      paymentStatus,
    );
    return {
      success: true,
      data: order,
    };
  }
}




