import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/CategorySchema';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { CreateCategoryDto } from './dto/CreateCategoryDto';
import { UpdateCategoryDto } from './dto/UpdateCategoryDto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) { }

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const [categories, total] = await Promise.all([
      this.categoryModel.find(query).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(query),
    ]);

    return {
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();
  }

  async delete(id: string) {
    // === RÀNG BUỘC XÓA DANH MỤC ===

    // 1. Kiểm tra danh mục có sản phẩm không
    const productsInCategory = await this.productModel.countDocuments({ category: id });
    if (productsInCategory > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục này vì đang có ${productsInCategory} sản phẩm thuộc danh mục này. Vui lòng chuyển hoặc xóa các sản phẩm trước.`
      );
    }

    // 2. Kiểm tra danh mục có danh mục con không (nếu có parent field)
    const childCategories = await this.categoryModel.countDocuments({ parent: id });
    if (childCategories > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục này vì đang có ${childCategories} danh mục con. Vui lòng xóa các danh mục con trước.`
      );
    }

    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    // === RÀNG BUỘC XÓA NHIỀU DANH MỤC ===

    // 1. Kiểm tra các danh mục có sản phẩm không
    const productsInCategories = await this.productModel.countDocuments({
      category: { $in: ids }
    });
    if (productsInCategories > 0) {
      throw new BadRequestException(
        `Không thể xóa các danh mục này vì đang có ${productsInCategories} sản phẩm thuộc các danh mục này.`
      );
    }

    // 2. Kiểm tra có danh mục con không
    const childCategories = await this.categoryModel.countDocuments({
      parent: { $in: ids }
    });
    if (childCategories > 0) {
      throw new BadRequestException(
        `Không thể xóa các danh mục này vì đang có ${childCategories} danh mục con.`
      );
    }

    return this.categoryModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
