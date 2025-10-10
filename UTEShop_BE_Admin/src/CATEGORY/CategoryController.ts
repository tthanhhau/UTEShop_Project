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
import { CategoryService } from './CategoryService';
import { CreateCategoryDto } from './DTO/CreateCategoryDto';
import { UpdateCategoryDto } from './DTO/UpdateCategoryDto';
import { JwtAuthGuard } from '../AUTH/GUARDS/JwtAuthGuard';

@Controller('admin/Categorys')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly CategoryService: CategoryService) {}

  @Get()
  async getCategorys(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.CategoryService.findAll(pageNum, limitNum);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.CategoryService.create(createCategoryDto);
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.CategoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.CategoryService.delete(id);
  }

  @Delete('multiple/delete')
  async deleteMultipleCategorys(@Body('ids') ids: string[]) {
    return this.CategoryService.deleteMultiple(ids);
  }
}

