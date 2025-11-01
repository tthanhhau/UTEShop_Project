import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Voucher, VoucherDocument } from '../schemas/VoucherSchema';
import { UserVoucher, UserVoucherDocument } from '../schemas/UserVoucherSchema';

@Injectable()
export class VoucherService {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
    @InjectModel(UserVoucher.name) private userVoucherModel: Model<UserVoucherDocument>,
  ) {}

  async findAll(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search
      ? {
          $or: [
            { code: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [vouchers, total] = await Promise.all([
      this.voucherModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.voucherModel.countDocuments(query),
    ]);

    // Sync claimsCount and usesCount from UserVoucher collection
    try {
      for (const voucher of vouchers) {
        let updateData: any = {};

        // Sync claimsCount - count all UserVoucher records for this voucher
        const actualClaimsCount = await this.userVoucherModel.countDocuments({
          voucher: voucher._id,
        });

        if (voucher.claimsCount !== actualClaimsCount) {
          updateData.claimsCount = actualClaimsCount;
        }

        // Sync usesCount - count used UserVoucher records
        const actualUsesCount = await this.userVoucherModel.countDocuments({
          voucher: voucher._id,
          isUsed: true,
        });

        if (voucher.usesCount !== actualUsesCount) {
          updateData.usesCount = actualUsesCount;
        }

        // Update if needed
        if (Object.keys(updateData).length > 0) {
          await this.voucherModel.updateOne(
            { _id: voucher._id },
            { $set: updateData }
          );
          
          // Update local voucher object to reflect changes
          Object.assign(voucher, updateData);
        }
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('Error syncing voucher counts:', error);
    }

    return {
      data: vouchers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async findById(id: string) {
    return this.voucherModel.findById(id).exec();
  }

  async create(voucherData: any) {
    const voucher = new this.voucherModel(voucherData);
    return voucher.save();
  }

  async update(id: string, voucherData: any) {
    return this.voucherModel
      .findByIdAndUpdate(id, voucherData, { new: true })
      .exec();
  }

  async delete(id: string) {
    return this.voucherModel.findByIdAndDelete(id).exec();
  }

  async getVoucherStats() {
    const totalVouchers = await this.voucherModel.countDocuments();
    const activeVouchers = await this.voucherModel.countDocuments({
      isActive: true,
      endDate: { $gte: new Date() },
    });
    const expiredVouchers = await this.voucherModel.countDocuments({
      endDate: { $lt: new Date() },
    });

    return {
      totalVouchers,
      activeVouchers,
      expiredVouchers,
    };
  }
}




