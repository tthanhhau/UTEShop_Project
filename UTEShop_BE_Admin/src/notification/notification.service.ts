import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    ) { }

    // Lấy tất cả thông báo chưa đọc
    async getUnreadNotifications() {
        return this.notificationModel
            .find({ isRead: false })
            .sort({ createdAt: -1 })
            .limit(20)
            .exec();
    }

    // Lấy tất cả thông báo
    async getAllNotifications(limit = 50) {
        return this.notificationModel
            .find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    // Đếm số thông báo chưa đọc
    async countUnread() {
        return this.notificationModel.countDocuments({ isRead: false });
    }

    // Tạo thông báo mới
    async createNotification(data: {
        title: string;
        message: string;
        type: string;
        orderId?: string;
    }) {
        const notification = new this.notificationModel(data);
        return notification.save();
    }

    // Đánh dấu đã đọc và xóa
    async markAsReadAndDelete(id: string) {
        return this.notificationModel.findByIdAndDelete(id);
    }

    // Đánh dấu tất cả đã đọc
    async markAllAsRead() {
        return this.notificationModel.updateMany(
            { isRead: false },
            { isRead: true }
        );
    }

    // Xóa tất cả thông báo đã đọc
    async deleteAllRead() {
        return this.notificationModel.deleteMany({ isRead: true });
    }
}
