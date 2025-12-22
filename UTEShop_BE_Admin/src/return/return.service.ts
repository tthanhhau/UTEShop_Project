import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReturnRequest, ReturnRequestDocument } from './return.schema';
import axios from 'axios';

@Injectable()
export class ReturnService {
    constructor(
        @InjectModel(ReturnRequest.name)
        private returnRequestModel: Model<ReturnRequestDocument>,
    ) { }

    // Lấy tất cả yêu cầu hoàn trả
    async findAll(status?: string) {
        const query: any = {};
        if (status) {
            query.status = status;
        }

        return this.returnRequestModel
            .find(query)
            .populate({
                path: 'order',
                populate: {
                    path: 'items.product',
                    select: 'name images price',
                },
            })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    // Lấy chi tiết yêu cầu hoàn trả
    async findOne(id: string) {
        const returnRequest = await this.returnRequestModel
            .findById(id)
            .populate({
                path: 'order',
                populate: {
                    path: 'items.product',
                    select: 'name images price',
                },
            })
            .populate('user', 'name email phone')
            .exec();

        if (!returnRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu hoàn trả');
        }

        return returnRequest;
    }

    // Duyệt yêu cầu hoàn trả
    async approve(id: string, adminNote: string = '') {
        const returnRequest = await this.returnRequestModel.findById(id);
        if (!returnRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu hoàn trả');
        }

        if (returnRequest.status !== 'pending') {
            throw new BadRequestException('Yêu cầu này đã được xử lý');
        }

        // Hoàn lại giá gốc của đơn hàng (refundAmount = giá sản phẩm trước voucher/điểm)
        // Đây là giá trị thực tế của sản phẩm, không phụ thuộc vào voucher hay điểm đã dùng
        const pointsToAdd = returnRequest.refundAmount;

        // Chỉ gọi API cộng điểm nếu có điểm cần cộng
        if (pointsToAdd > 0) {
            try {
                const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
                await axios.post(`${userBackendUrl}/api/internal/add-points`, {
                    userId: returnRequest.user.toString(),
                    points: pointsToAdd,
                    reason: `Hoàn trả đơn hàng - ${returnRequest.order.toString()}`,
                });
            } catch (error) {
                console.error('Error adding points to user:', error);
                throw new BadRequestException('Không thể cộng điểm cho khách hàng');
            }
        }

        // Cập nhật trạng thái yêu cầu
        returnRequest.status = 'approved';
        returnRequest.pointsAwarded = pointsToAdd;
        returnRequest.adminNote = adminNote;
        returnRequest.processedAt = new Date();

        await returnRequest.save();

        // Gửi thông báo cho user
        try {
            const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${userBackendUrl}/api/internal/send-notification`, {
                userId: returnRequest.user.toString(),
                title: 'Yêu cầu hoàn trả được chấp nhận',
                message: `Yêu cầu hoàn trả đơn hàng của bạn đã được chấp nhận. Bạn đã được cộng ${pointsToAdd.toLocaleString('vi-VN')} điểm tích lũy.`,
                type: 'return_approved',
                data: {
                    returnRequestId: returnRequest._id,
                    orderId: returnRequest.order,
                    pointsAwarded: pointsToAdd,
                },
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            // Không throw error vì việc gửi thông báo không critical
        }

        return returnRequest;
    }

    // Từ chối yêu cầu hoàn trả
    async reject(id: string, adminNote: string) {
        const returnRequest = await this.returnRequestModel.findById(id);
        if (!returnRequest) {
            throw new NotFoundException('Không tìm thấy yêu cầu hoàn trả');
        }

        if (returnRequest.status !== 'pending') {
            throw new BadRequestException('Yêu cầu này đã được xử lý');
        }

        returnRequest.status = 'rejected';
        returnRequest.adminNote = adminNote;
        returnRequest.processedAt = new Date();

        await returnRequest.save();

        // Gửi thông báo cho user
        try {
            const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:5000';
            await axios.post(`${userBackendUrl}/api/internal/send-notification`, {
                userId: returnRequest.user.toString(),
                title: 'Yêu cầu hoàn trả bị từ chối',
                message: `Yêu cầu hoàn trả đơn hàng của bạn đã bị từ chối. Lý do: ${adminNote}`,
                type: 'return_rejected',
                data: {
                    returnRequestId: returnRequest._id,
                    orderId: returnRequest.order,
                    reason: adminNote,
                },
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }

        return returnRequest;
    }

    // Thống kê
    async getStats() {
        const [pending, approved, rejected, totalRefunded] = await Promise.all([
            this.returnRequestModel.countDocuments({ status: 'pending' }),
            this.returnRequestModel.countDocuments({ status: 'approved' }),
            this.returnRequestModel.countDocuments({ status: 'rejected' }),
            this.returnRequestModel.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$pointsAwarded' } } },
            ]),
        ]);

        return {
            pending,
            approved,
            rejected,
            totalRefunded: totalRefunded[0]?.total || 0,
        };
    }
}
