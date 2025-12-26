import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  // Kiểm tra xem danh mục có thể xóa được không
  async canDelete(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      return { canDelete: false, message: 'Danh mục không tồn tại' };
    }

    const objectId = new Types.ObjectId(id);
    const productsInCategory = await this.productModel.countDocuments({
      $or: [{ category: id }, { category: objectId }],
    });

    if (productsInCategory > 0) {
      return {
        canDelete: false,
        message: `Không thể xóa danh mục "${category.name}" vì đang có ${productsInCategory} sản phẩm thuộc danh mục này. Vui lòng chuyển hoặc xóa các sản phẩm trước.`,
        productCount: productsInCategory,
      };
    }

    return { canDelete: true, message: 'Có thể xóa danh mục này' };
  }

  // Kiểm tra xem nhiều danh mục có thể xóa được không
  async canDeleteMultiple(ids: string[]) {
    const objectIds = ids.map((id) => new Types.ObjectId(id));

    const productsInCategories = await this.productModel.countDocuments({
      $or: [{ category: { $in: ids } }, { category: { $in: objectIds } }],
    });

    if (productsInCategories > 0) {
      const categoriesWithProducts = await this.productModel.distinct(
        'category',
        {
          $or: [{ category: { $in: ids } }, { category: { $in: objectIds } }],
        },
      );
      const categoryNames = await this.categoryModel
        .find({ _id: { $in: categoriesWithProducts } })
        .select('name');
      const names = categoryNames.map((c) => c.name).join(', ');

      return {
        canDelete: false,
        message: `Không thể xóa vì có ${productsInCategories} sản phẩm thuộc các danh mục: ${names}. Vui lòng chuyển hoặc xóa các sản phẩm trước.`,
        productCount: productsInCategories,
      };
    }

    return { canDelete: true, message: 'Có thể xóa các danh mục này' };
  }

  async delete(id: string) {
    // === RÀNG BUỘC XÓA DANH MỤC ===
    
    // Kiểm tra danh mục có tồn tại không
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại');
    }

    // Kiểm tra danh mục có sản phẩm không (query cả string và ObjectId)
    const objectId = new Types.ObjectId(id);
    const productsInCategory = await this.productModel.countDocuments({
      $or: [
        { category: id },
        { category: objectId }
      ]
    });
    
    console.log(`🔴 Checking category ${id} - Found ${productsInCategory} products`);
    
    if (productsInCategory > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục "${category.name}" vì đang có ${productsInCategory} sản phẩm thuộc danh mục này. Vui lòng chuyển hoặc xóa các sản phẩm trước.`
      );
    }

    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async deleteMultiple(ids: string[]) {
    // === RÀNG BUỘC XÓA NHIỀU DANH MỤC ===

    // Convert string ids to ObjectIds
    const objectIds = ids.map(id => new Types.ObjectId(id));

    // Kiểm tra các danh mục có sản phẩm không (query cả string và ObjectId)
    const productsInCategories = await this.productModel.countDocuments({
      $or: [
        { category: { $in: ids } },
        { category: { $in: objectIds } }
      ]
    });
    
    console.log(`🔴 Checking categories ${ids.join(', ')} - Found ${productsInCategories} products`);
    
    if (productsInCategories > 0) {
      // Lấy danh sách tên các danh mục có sản phẩm
      const categoriesWithProducts = await this.productModel.distinct('category', {
        $or: [
          { category: { $in: ids } },
          { category: { $in: objectIds } }
        ]
      });
      const categoryNames = await this.categoryModel.find({
        _id: { $in: categoriesWithProducts }
      }).select('name');
      const names = categoryNames.map(c => c.name).join(', ');
      
      throw new BadRequestException(
        `Không thể xóa vì có ${productsInCategories} sản phẩm thuộc các danh mục: ${names}. Vui lòng chuyển hoặc xóa các sản phẩm trước.`
      );
    }

    return this.categoryModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
