import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/OrderSchema';
import { User, UserDocument } from '../schemas/UserSchema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async findAll(page = 1, limit = 10, status = '', paymentStatus = '', paymentMethod = '', search = '') {
    console.log('🟢🟢🟢 ORDER Service - search:', search, 'status:', status, 'paymentStatus:', paymentStatus, 'paymentMethod:', paymentMethod);
    const skip = (page - 1) * limit;
    const query: any = {};

    // Build filter conditions
    const filterConditions: any = {};
    if (status) {
      filterConditions.status = status;
    }
    if (paymentStatus) {
      filterConditions.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      filterConditions.paymentMethod = paymentMethod;
    }

    // Build search conditions
    if (search) {
      // Tìm users có name match search term
      const users = await this.userModel.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').exec();

      const userIds = users.map(u => u._id);
      console.log('🟢🟢🟢 ORDER Service - found', userIds.length, 'users matching search');

      // Tìm kiếm theo mã đơn hàng (_id) hoặc user
      const searchConditions: any = {
        $or: []
      };

      // Tìm theo _id (mã đơn hàng) - ObjectId có thể được tìm bằng string
      // Nếu search có thể là ObjectId hợp lệ, thử tìm theo _id
      try {
        // Nếu search là ObjectId hợp lệ, thêm vào điều kiện tìm kiếm
        if (Types.ObjectId.isValid(search)) {
          searchConditions.$or.push({ _id: new Types.ObjectId(search) });
        }
        // Nếu không phải ObjectId hợp lệ nhưng có độ dài phù hợp, tìm theo string representation
        else if (search.length >= 8) {
          // Dùng aggregation để convert _id sang string và tìm kiếm
          searchConditions.$or.push({
            $expr: {
              $regexMatch: {
                input: { $toString: '$_id' },
                regex: search,
                options: 'i'
              }
            }
          });
        }
      } catch (e) {
        console.log('Error converting search to ObjectId:', e);
      }

      // Tìm theo user
      if (userIds.length > 0) {
        searchConditions.$or.push({ user: { $in: userIds } });
      }

      // Nếu không có điều kiện nào trong $or, loại bỏ searchConditions
      if (searchConditions.$or.length === 0) {
        searchConditions.$or.push({ _id: null }); // Không match gì cả
      }

      // Nếu có cả filter và search, dùng $and để kết hợp
      if (Object.keys(filterConditions).length > 0) {
        query.$and = [
          filterConditions,
          searchConditions
        ];
      } else {
        // Nếu chỉ có search, chỉ cần $or
        Object.assign(query, searchConditions);
      }
    } else {
      // Nếu không có search, chỉ cần filter conditions
      Object.assign(query, filterConditions);
    }

    console.log('🟢🟢🟢 ORDER Service - query:', JSON.stringify(query));

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    console.log('🟢🟢🟢 ORDER Service - found:', total, 'orders');

    return {
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.orderModel
      .findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .exec();
  }

  async updateStatus(id: string, status: string) {
    // Lấy thông tin đơn hàng hiện tại
    const order = await this.orderModel.findById(id).exec();
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    console.log('🔍 UPDATE STATUS - Order ID:', id);
    console.log('🔍 UPDATE STATUS - Current status:', order.status);
    console.log('🔍 UPDATE STATUS - New status:', status);
    console.log('🔍 UPDATE STATUS - Payment method:', order.paymentMethod);
    console.log('🔍 UPDATE STATUS - Current payment status:', order.paymentStatus);
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = { status };
    
    // Nếu chuyển sang "đã giao" và thanh toán COD thì tự động chuyển sang "đã thanh toán"
    if (status === 'delivered' && order.paymentMethod === 'COD') {
      console.log('✅ AUTO UPDATE - Setting paymentStatus to paid');
      updateData.paymentStatus = 'paid';
    }
    
    console.log('🔍 UPDATE STATUS - Update data:', updateData);
    
    // Sử dụng findOneAndUpdate để cập nhật và trả về ngay lập tức
    const updatedOrder = await this.orderModel
      .findOneAndUpdate(
        { _id: id }, 
        updateData, 
        { 
          new: true,  // Trả về document sau khi update
          runValidators: true  // Chạy validators khi update
        }
      )
      .exec();
    
    if (!updatedOrder) {
      console.error('❌ ERROR: Could not update order');
      throw new Error('Failed to update order');
    }
    
    console.log('🔍 AFTER UPDATE - Order status:', updatedOrder.status);
    console.log('🔍 AFTER UPDATE - Payment status:', updatedOrder.paymentStatus);
    
    return updatedOrder;
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    return this.orderModel
      .findByIdAndUpdate(id, { paymentStatus }, { new: true })
      .exec();
  }

  async getOrderStats() {
    // Count orders by status
    const totalOrders = await this.orderModel.countDocuments();
    const pendingOrders = await this.orderModel.countDocuments({
      status: 'pending',
    });
    const processingOrders = await this.orderModel.countDocuments({
      status: 'processing',
    });
    const deliveredOrders = await this.orderModel.countDocuments({
      status: 'delivered',
    });
    const cancelledOrders = await this.orderModel.countDocuments({
      status: 'cancelled',
    });

    // Calculate total revenue (all orders)
    const totalRevenueResult = await this.orderModel.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    // Calculate pending revenue (pending + processing orders)
    const pendingRevenueResult = await this.orderModel.aggregate([
      { $match: { status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    // Calculate confirmed revenue (delivered orders)
    const confirmedRevenueResult = await this.orderModel.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      pendingRevenue: pendingRevenueResult[0]?.total || 0,
      confirmedRevenue: confirmedRevenueResult[0]?.total || 0,
    };
  }
}




