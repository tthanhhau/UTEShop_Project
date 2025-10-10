import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BrandService } from './BrandService';
import { CreateBrandDto } from './DTO/CreateBrandDto';
import { UpdateBrandDto } from './DTO/UpdateBrandDto';
import { JwtAuthGuard } from '../AUTH/GUARDS/JwtAuthGuard';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  async getBrands(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.brandService.findAll(pageNum, limitNum);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post()
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Put(':id')
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string) {
    return this.brandService.delete(id);
  }

  @Delete('multiple/delete')
  async deleteMultipleBrands(@Body('ids') ids: string[]) {
    return this.brandService.deleteMultiple(ids);
  }
}






