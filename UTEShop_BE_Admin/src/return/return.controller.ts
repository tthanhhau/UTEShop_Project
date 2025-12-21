import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ReturnService } from './return.service';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnController {
    constructor(private readonly returnService: ReturnService) { }

    // Lấy tất cả yêu cầu hoàn trả
    @Get()
    async findAll(@Query('status') status?: string) {
        return this.returnService.findAll(status);
    }

    // Lấy thống kê
    @Get('stats')
    async getStats() {
        return this.returnService.getStats();
    }

    // Lấy chi tiết yêu cầu hoàn trả
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.returnService.findOne(id);
    }

    // Duyệt yêu cầu hoàn trả
    @Post(':id/approve')
    async approve(
        @Param('id') id: string,
        @Body('adminNote') adminNote?: string,
    ) {
        return this.returnService.approve(id, adminNote);
    }

    // Từ chối yêu cầu hoàn trả
    @Post(':id/reject')
    async reject(
        @Param('id') id: string,
        @Body('adminNote') adminNote: string,
    ) {
        return this.returnService.reject(id, adminNote);
    }
}
