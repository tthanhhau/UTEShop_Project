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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandService } from './BrandService';
import { CreateBrandDto } from './DTO/CreateBrandDto';
import { UpdateBrandDto } from './DTO/UpdateBrandDto';
import { JwtAuthGuard } from '../AUTH/GUARDS/JwtAuthGuard';
import cloudinary from '../config/cloudinary.config';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) { }

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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'brands',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });

      return {
        success: true,
        url: (result as any).secure_url,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: 'Lỗi upload ảnh',
        error: error.message,
      };
    }
  }
}






