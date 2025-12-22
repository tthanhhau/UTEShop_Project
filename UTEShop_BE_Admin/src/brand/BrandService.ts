import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/BrandSchema';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { CreateBrandDto } from '../brand/dto/CreateBrandDto';
import { UpdateBrandDto } from '../brand/dto/UpdateBrandDto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) { }

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const [brands, total] = await Promise.all([
      this.brandModel.find(query).skip(skip).limit(limit).exec(),
      this.brandModel.countDocuments(query),
    ]);

    return {
      data: brands,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.brandModel.findById(id).exec();
  }

  async create(createBrandDto: CreateBrandDto) {
    const brand = new this.brandModel(createBrandDto);
    return brand.save();
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    return this.brandModel
      .findByIdAndUpdate(id, updateBrandDto, { new: true })
      .exec();
  }

  async delete(id: string) {
    // === RÀNG BUỘC XÓA THƯƠNG HIỆU ===

    // Kiểm tra thương hiệu có sản phẩm không
    const productsWithBrand = await this.productModel.countDocuments({ brand: id });
    if (productsWithBrand > 0) {
      throw new BadRequestException(
        `Không thể xóa thương hiệu này vì đang có ${productsWithBrand} sản phẩm thuộc thương hiệu này. Vui lòng chuyển hoặc xóa các sản phẩm trước.`
      );
    }

    return this.brandModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    // === RÀNG BUỘC XÓA NHIỀU THƯƠNG HIỆU ===

    const productsWithBrands = await this.productModel.countDocuments({
      brand: { $in: ids }
    });
    if (productsWithBrands > 0) {
      throw new BadRequestException(
        `Không thể xóa các thương hiệu này vì đang có ${productsWithBrands} sản phẩm thuộc các thương hiệu này.`
      );
    }

    return this.brandModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
