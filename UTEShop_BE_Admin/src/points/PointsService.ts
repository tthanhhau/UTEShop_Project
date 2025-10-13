import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PointTransaction,
  PointTransactionDocument,
} from '../schemas/PointTransactionSchema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(PointTransaction.name)
    private pointTransactionModel: Model<PointTransactionDocument>,
  ) {}

  async findAll(page = 1, limit = 10, type = '') {
    const skip = (page - 1) * limit;
    const query = type ? { type } : {};

    const [transactions, total] = await Promise.all([
      this.pointTransactionModel
        .find(query)
        .populate('user', 'name email')
        .populate('order', '_id totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.pointTransactionModel.countDocuments(query),
    ]);

    return {
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getPointsStats() {
    const totalTransactions =
      await this.pointTransactionModel.countDocuments();

    const totalPointsEarned = await this.pointTransactionModel.aggregate([
      { $match: { type: { $in: ['EARNED', 'earn'] } } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);

    const totalPointsRedeemed = await this.pointTransactionModel.aggregate([
      { $match: { type: { $in: ['REDEEMED', 'redeem'] } } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);

    return {
      totalTransactions,
      totalPointsEarned: totalPointsEarned[0]?.total || 0,
      totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
    };
  }

  async getUserPoints(userId: string) {
    const transactions = await this.pointTransactionModel
      .find({ user: userId })
      .exec();

    const totalPoints = transactions.reduce(
      (sum, t) => sum + t.points,
      0,
    );

    return {
      userId,
      totalPoints,
      transactions,
    };
  }
}



