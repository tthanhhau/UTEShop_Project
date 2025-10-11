import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './CustomerService';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async getCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.customerService.findAll(
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
  async getCustomerStats() {
    const stats = await this.customerService.getCustomerStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id/orders')
  async getCustomerOrders(@Param('id') id: string) {
    const data = await this.customerService.getCustomerOrderHistory(id);
    return {
      success: true,
      data: data,
    };
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    const customer = await this.customerService.findById(id);
    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id/status')
  async updateCustomerStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const customer = await this.customerService.updateStatus(id, isActive);
    return {
      success: true,
      data: customer,
    };
  }
}




