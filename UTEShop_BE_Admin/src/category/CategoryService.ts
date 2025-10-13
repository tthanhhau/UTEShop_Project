import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/CategorySchema';
import { CreateCategoryDto } from './dto/CreateCategoryDto';
import { UpdateCategoryDto } from './dto/UpdateCategoryDto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
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
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    return this.categoryModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
