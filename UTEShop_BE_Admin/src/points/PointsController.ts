import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PointsService } from './PointsService';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('admin/points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  async getPointTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.pointsService.findAll(
      pageNum,
      limitNum,
      type || '',
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  async getPointsStats() {
    const stats = await this.pointsService.getPointsStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('user/:userId')
  async getUserPoints(@Param('userId') userId: string) {
    const data = await this.pointsService.getUserPoints(userId);
    return {
      success: true,
      data,
    };
  }
}




