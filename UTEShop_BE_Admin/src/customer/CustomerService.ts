import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/UserSchema';
import { Order, OrderDocument } from '../schemas/OrderSchema';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search
      ? {
          role: { $in: ['user', 'customer'] }, // Only customers, not admins
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : { role: { $in: ['user', 'customer'] } };

    const [customers, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password') // Exclude password
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    // Enrich customers with order stats
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const customerObj: any = customer.toObject();
        
        // Get order stats for this customer
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
      console.log('Fetching customer order history for:', customerId);
      
      // Get customer info
      const customer = await this.userModel
        .findById(customerId)
        .select('-password')
        .exec();

      if (!customer) {
        console.error('Customer not found:', customerId);
        throw new Error('Customer not found');
      }

      console.log('Customer found:', customer.email);

      // Convert customerId string to ObjectId
      const customerObjectId = new Types.ObjectId(customerId);
      console.log('Searching orders with ObjectId:', customerObjectId);

      // Get all orders for this customer
      const orders = await this.orderModel
        .find({ user: customerObjectId })
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .exec();

      console.log(`Found ${orders.length} orders for customer ${customer.email}`);

      // Get customer with full details
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
}

