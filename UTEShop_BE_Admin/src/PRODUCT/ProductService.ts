import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../SCHEMAS/ProductSchema';
import { CreateProductDto } from './DTO/CreateProductDto';
import { UpdateProductDto } from './DTO/UpdateProductDto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    search = '',
    category = '',
    brand = '',
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category')
        .populate('brand')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.productModel
      .findById(id)
      .populate('category')
      .populate('brand')
      .exec();
  }

  async create(createProductDto: CreateProductDto) {
    const product = new this.productModel(createProductDto);
    return product.save();
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('category')
      .populate('brand')
      .exec();
  }

  async delete(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    return this.productModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
