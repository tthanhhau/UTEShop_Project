import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Voucher, VoucherDocument } from '../SCHEMAS/VoucherSchema';

@Injectable()
export class VoucherService {
  constructor(
    @InjectModel(Voucher.name) private voucherModel: Model<VoucherDocument>,
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




