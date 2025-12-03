import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { Review, ReviewDocument } from '../schemas/ReviewSchema';
import { CreateProductDto } from './dto/CreateProductDto';
import { UpdateProductDto } from './dto/UpdateProductDto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private httpService: HttpService,
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
    console.log(`🔍 [ADMIN-PRODUCT] Starting delete for product: ${id}`);

    // First, delete all reviews associated with this product
    const deleteResult = await this.reviewModel.deleteMany({ product: id });
    console.log(`🗑️ [ADMIN-PRODUCT] Deleted ${deleteResult.deletedCount} reviews from admin database for product: ${id}`);

    // Gọi đến backend user để xóa các review đó cũng
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
      const deleteUrl = `${userBackendUrl}/api/internal/reviews/product/${id}`;
      console.log(`📡 [ADMIN-PRODUCT] Calling user backend at: ${deleteUrl}`);

      const response = await this.httpService.delete(deleteUrl).toPromise();
      console.log(`✅ [ADMIN-PRODUCT] Successfully deleted reviews for product ${id} from user backend`);
      console.log(`📊 [ADMIN-PRODUCT] User backend response:`, response?.data);
    } catch (error) {
      console.error(`❌ [ADMIN-PRODUCT] Failed to delete reviews for product ${id} from user backend:`, error.message);
      console.error(`❌ [ADMIN-PRODUCT] Full error:`, error);
      // Không throw error vì admin backend đã xóa thành công
    }

    // Then delete the product
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    console.log(`✅ [ADMIN-PRODUCT] Deleted product: ${id}`);

    return deletedProduct;
  }

  async deleteMultiple(ids: string[]) {
    // First, delete all reviews associated with these products
    await this.reviewModel.deleteMany({ product: { $in: ids } });

    // Gọi đến backend user để xóa các review đó cũng
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
      for (const id of ids) {
        await this.httpService.delete(`${userBackendUrl}/api/internal/reviews/product/${id}`).toPromise();
        console.log(`✅ Successfully deleted reviews for product ${id} from user backend`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete reviews for products from user backend:`, error.message);
      // Không throw error vì admin backend đã xóa thành công
    }

    // Then delete the products
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
