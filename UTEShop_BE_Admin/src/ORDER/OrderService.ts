import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../SCHEMAS/OrderSchema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(page = 1, limit = 10, status = '') {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

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
    return this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
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




