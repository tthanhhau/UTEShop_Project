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
import { ProductService } from '../product/ProductService';
import { CreateProductDto } from './dto/CreateProductDto';
import { UpdateProductDto } from './dto/UpdateProductDto';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('admin/Products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly ProductService: ProductService) { }

  @Get()
  async getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.ProductService.findAll(pageNum, limitNum, search || '', category || '', brand || '');

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.ProductService.create(createProductDto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.ProductService.update(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.ProductService.delete(id);
  }

  @Delete('multiple/delete')
  async deleteMultipleProducts(@Body('ids') ids: string[]) {
    return this.ProductService.deleteMultiple(ids);
  }
}

