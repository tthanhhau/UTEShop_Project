import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { Review, ReviewDocument } from '../schemas/ReviewSchema';
import { Order, OrderDocument } from '../schemas/OrderSchema';
import { ReturnRequest, ReturnRequestDocument } from '../return/return.schema';
import { CreateProductDto } from './dto/CreateProductDto';
import { UpdateProductDto } from './dto/UpdateProductDto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(ReturnRequest.name) private returnRequestModel: Model<ReturnRequestDocument>,
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
      if (Types.ObjectId.isValid(category)) {
        query.category = new Types.ObjectId(category);
      }
    }
    if (brand) {
      if (Types.ObjectId.isValid(brand)) {
        query.brand = new Types.ObjectId(brand);
      }
    }

    console.log('🔍 Query:', {
      category: query.category?.toString(),
      brand: query.brand?.toString(),
      search: search
    });

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category')
        .populate('brand')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    console.log(`📊 Found ${total} products, returning ${products.length}`);

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
    // Ensure category and brand are ObjectId
    const productData: any = {
      ...createProductDto,
      category: new Types.ObjectId(createProductDto.category),
      brand: new Types.ObjectId(createProductDto.brand)
    };

    const product = new this.productModel(productData);
    return product.save();
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Ensure category and brand are ObjectId if provided
    const updateData: any = { ...updateProductDto };
    if (updateData.category) {
      updateData.category = new Types.ObjectId(updateData.category);
    }
    if (updateData.brand) {
      updateData.brand = new Types.ObjectId(updateData.brand);
    }

    return this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category')
      .populate('brand')
      .exec();
  }

  async delete(id: string) {
    console.log(`🔍 [ADMIN-PRODUCT] Starting delete for product: ${id}`);

    // === RÀNG BUỘC XÓA SẢN PHẨM ===

    // 1. Kiểm tra sản phẩm có trong đơn hàng chưa hoàn thành không
    const pendingStatuses = ['pending', 'processing', 'prepared', 'shipped'];
    const ordersWithProduct = await this.orderModel.countDocuments({
      'items.product': new Types.ObjectId(id),
      status: { $in: pendingStatuses }
    });

    if (ordersWithProduct > 0) {
      throw new BadRequestException(
        `Không thể xóa sản phẩm này vì đang có ${ordersWithProduct} đơn hàng chưa hoàn thành chứa sản phẩm này. Vui lòng chờ các đơn hàng hoàn thành hoặc hủy trước khi xóa.`
      );
    }

    // 2. Kiểm tra sản phẩm có yêu cầu hoàn trả đang chờ xử lý không
    const pendingReturns = await this.returnRequestModel.countDocuments({
      status: 'pending'
    }).populate({
      path: 'order',
      match: { 'items.product': new Types.ObjectId(id) }
    });

    // Cách khác: tìm các order có product này, rồi check return request
    const ordersWithThisProduct = await this.orderModel.find({
      'items.product': new Types.ObjectId(id)
    }).select('_id');

    const orderIds = ordersWithThisProduct.map(o => o._id);
    const pendingReturnRequests = await this.returnRequestModel.countDocuments({
      order: { $in: orderIds },
      status: 'pending'
    });

    if (pendingReturnRequests > 0) {
      throw new BadRequestException(
        `Không thể xóa sản phẩm này vì đang có ${pendingReturnRequests} yêu cầu hoàn trả chờ xử lý liên quan đến sản phẩm này.`
      );
    }

    // 3. Kiểm tra sản phẩm có trong giỏ hàng của user không (gọi API user backend)
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
      const checkCartUrl = `${userBackendUrl}/api/internal/check-product-in-carts/${id}`;
      const cartResponse = await this.httpService.get(checkCartUrl).toPromise();

      if (cartResponse?.data?.count > 0) {
        throw new BadRequestException(
          `Không thể xóa sản phẩm này vì đang có ${cartResponse?.data?.count} giỏ hàng chứa sản phẩm này.`
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log('⚠️ Could not check cart status, proceeding with delete');
    }

    // === XÓA CÁC DỮ LIỆU LIÊN QUAN ===

    // Xóa reviews
    const deleteResult = await this.reviewModel.deleteMany({ product: id });
    console.log(`🗑️ [ADMIN-PRODUCT] Deleted ${deleteResult.deletedCount} reviews from admin database for product: ${id}`);

    // Gọi đến backend user để xóa reviews và cleanup
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';

      // Xóa reviews
      const deleteUrl = `${userBackendUrl}/api/internal/reviews/product/${id}`;
      await this.httpService.delete(deleteUrl).toPromise();
      console.log(`✅ [ADMIN-PRODUCT] Successfully deleted reviews for product ${id} from user backend`);

      // Xóa khỏi favorites và viewed products
      const cleanupUrl = `${userBackendUrl}/api/internal/cleanup-product/${id}`;
      await this.httpService.delete(cleanupUrl).toPromise();
      console.log(`✅ [ADMIN-PRODUCT] Successfully cleaned up product ${id} from user favorites and viewed`);
    } catch (error) {
      console.error(`❌ [ADMIN-PRODUCT] Failed to cleanup product ${id} from user backend:`, error.message);
    }

    // Xóa sản phẩm
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    console.log(`✅ [ADMIN-PRODUCT] Deleted product: ${id}`);

    return deletedProduct;
  }

  async deleteMultiple(ids: string[]) {
    // === RÀNG BUỘC XÓA NHIỀU SẢN PHẨM ===
    const pendingStatuses = ['pending', 'processing', 'prepared', 'shipped'];
    const objectIds = ids.map(id => new Types.ObjectId(id));

    // 1. Kiểm tra sản phẩm có trong đơn hàng chưa hoàn thành không
    const ordersWithProducts = await this.orderModel.countDocuments({
      'items.product': { $in: objectIds },
      status: { $in: pendingStatuses }
    });

    if (ordersWithProducts > 0) {
      throw new BadRequestException(
        `Không thể xóa các sản phẩm này vì đang có ${ordersWithProducts} đơn hàng chưa hoàn thành chứa các sản phẩm này.`
      );
    }

    // 2. Kiểm tra yêu cầu hoàn trả đang chờ
    const ordersWithTheseProducts = await this.orderModel.find({
      'items.product': { $in: objectIds }
    }).select('_id');

    const orderIds = ordersWithTheseProducts.map(o => o._id);
    const pendingReturnRequests = await this.returnRequestModel.countDocuments({
      order: { $in: orderIds },
      status: 'pending'
    });

    if (pendingReturnRequests > 0) {
      throw new BadRequestException(
        `Không thể xóa các sản phẩm này vì đang có ${pendingReturnRequests} yêu cầu hoàn trả chờ xử lý.`
      );
    }

    // === XÓA DỮ LIỆU LIÊN QUAN ===
    await this.reviewModel.deleteMany({ product: { $in: ids } });

    // Gọi đến backend user để xóa các review và cleanup
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
      for (const id of ids) {
        await this.httpService.delete(`${userBackendUrl}/api/internal/reviews/product/${id}`).toPromise();
        await this.httpService.delete(`${userBackendUrl}/api/internal/cleanup-product/${id}`).toPromise();
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup products from user backend:`, error.message);
    }

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
