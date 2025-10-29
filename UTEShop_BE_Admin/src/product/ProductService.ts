import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { CreateProductDto } from './dto/CreateProductDto';
import { UpdateProductDto } from './dto/UpdateProductDto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) { }

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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    // Convert string to ObjectId for category and brand
    if (category) {
      query.category = Types.ObjectId.isValid(category)
        ? new Types.ObjectId(category)
        : category;
    }
    if (brand) {
      query.brand = Types.ObjectId.isValid(brand)
        ? new Types.ObjectId(brand)
        : brand;
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

  async toggleVisibility(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { isActive: !product.isActive },
        { new: true }
      )
      .populate('category')
      .populate('brand')
      .exec();

    if (!updatedProduct) {
      throw new Error('Không thể cập nhật sản phẩm');
    }

    return {
      success: true,
      data: updatedProduct,
      message: `Đã ${updatedProduct.isActive ? 'hiển thị' : 'ẩn'} sản phẩm`
    };
  }
}
