import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/UserSchema';
import { Order, OrderDocument } from '../schemas/OrderSchema';
import { ReturnRequest, ReturnRequestDocument } from '../return/return.schema';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(ReturnRequest.name) private returnRequestModel: Model<ReturnRequestDocument>,
    private httpService: HttpService,
  ) { }

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search
      ? {
        role: { $in: ['user', 'customer'] },
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
      : { role: { $in: ['user', 'customer'] } };

    const [customers, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const customerObj: any = customer.toObject();
        const customerObjId = new Types.ObjectId((customer._id as Types.ObjectId).toString());
        const orders = await this.orderModel
          .find({ user: customerObjId })
          .select('totalPrice')
          .exec();

        customerObj.totalOrders = orders.length;
        customerObj.totalSpent = orders.reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);
        return customerObj;
      }),
    );

    return {
      data: enrichedCustomers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  async getCustomerStats() {
    const totalCustomers = await this.userModel.countDocuments({
      role: { $in: ['user', 'customer'] },
    });
    const activeCustomers = await this.userModel.countDocuments({
      role: { $in: ['user', 'customer'] },
      isActive: true,
    });

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .select('-password')
      .exec();
  }

  async getCustomerOrderHistory(customerId: string) {
    try {
      const customer = await this.userModel
        .findById(customerId)
        .select('-password')
        .exec();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const customerObjectId = new Types.ObjectId(customerId);
      const orders = await this.orderModel
        .find({ user: customerObjectId })
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .exec();

      const customerObj: any = customer.toObject();

      return {
        customer: customerObj,
        orders: orders || [],
      };
    } catch (error) {
      console.error('Error in getCustomerOrderHistory:', error);
      throw error;
    }
  }


  // === XÓA KHÁCH HÀNG VỚI RÀNG BUỘC ===
  async deleteCustomer(id: string) {
    // 1. Kiểm tra user có đơn hàng chưa hoàn thành không
    const pendingStatuses = ['pending', 'processing', 'prepared', 'shipped'];
    const pendingOrders = await this.orderModel.countDocuments({
      user: new Types.ObjectId(id),
      status: { $in: pendingStatuses }
    });

    if (pendingOrders > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng này vì đang có ${pendingOrders} đơn hàng chưa hoàn thành. Vui lòng chờ các đơn hàng hoàn thành hoặc hủy trước.`
      );
    }

    // 2. Kiểm tra user có yêu cầu hoàn trả đang chờ không
    const pendingReturns = await this.returnRequestModel.countDocuments({
      user: new Types.ObjectId(id),
      status: 'pending'
    });

    if (pendingReturns > 0) {
      throw new BadRequestException(
        `Không thể xóa khách hàng này vì đang có ${pendingReturns} yêu cầu hoàn trả chờ xử lý.`
      );
    }

    // 3. Gọi API user backend để xóa dữ liệu liên quan (cart, favorites, viewed)
    try {
      const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
      await this.httpService.delete(`${userBackendUrl}/api/internal/cleanup-user/${id}`).toPromise();
      console.log(`✅ Successfully cleaned up user data for ${id}`);
    } catch (error: any) {
      console.error(`❌ Failed to cleanup user data:`, error.message);
    }

    // 4. Xóa user
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
