import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PointTransaction,
  PointTransactionDocument,
} from '../schemas/PointTransactionSchema';
import { User, UserDocument } from '../schemas/UserSchema';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(PointTransaction.name)
    private pointTransactionModel: Model<PointTransactionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
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

    // Count members by tier
    const membersByTier = await this.userModel.aggregate([
      {
        $match: {
          role: { $in: ['user', 'customer'] }
        }
      },
      {
        $group: {
          _id: '$loyaltyPoints.tier',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const tierCounts = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0
    };

    membersByTier.forEach((item: any) => {
      const tier = item._id || 'BRONZE';
      tierCounts[tier] = item.count;
    });

    return {
      totalTransactions,
      totalPointsEarned: totalPointsEarned[0]?.total || 0,
      totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
      membersByTier: tierCounts
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



