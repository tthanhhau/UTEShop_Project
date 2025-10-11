import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../schemas/BrandSchema';
import { CreateBrandDto } from './dto/CreateBrandDto';
import { UpdateBrandDto } from './dto/UpdateBrandDto';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

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
    return this.brandModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    return this.brandModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
