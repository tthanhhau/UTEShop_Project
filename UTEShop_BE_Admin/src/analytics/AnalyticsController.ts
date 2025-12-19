import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../analytics/AnalyticsService';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('general-stats')
  async getGeneralStats(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    return this.analyticsService.getGeneralStats(yearNum);
  }

  @Get('revenue')
  async getRevenue(
    @Query('year') year?: string,
    @Query('type') type?: string,
  ) {
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    return this.analyticsService.getRevenue(yearNum, type || 'monthly');
  }

  @Get('completed-orders')
  async getCompletedOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getCompletedOrders(pageNum, limitNum);
  }

  @Get('new-customers')
  async getNewCustomers(
    @Query('year') year?: string,
    @Query('type') type?: string,
  ) {
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    return this.analyticsService.getNewCustomers(yearNum, type || 'monthly');
  }

  @Get('top-products')
  async getTopProducts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopProducts(limitNum);
  }
}






