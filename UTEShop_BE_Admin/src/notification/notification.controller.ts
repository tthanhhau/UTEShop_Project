import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    // Lấy thông báo chưa đọc
    @UseGuards(JwtAuthGuard)
    @Get('unread')
    async getUnreadNotifications() {
        const notifications = await this.notificationService.getUnreadNotifications();
        const count = await this.notificationService.countUnread();
        return {
            success: true,
            data: notifications,
            unreadCount: count,
        };
    }

    // Lấy tất cả thông báo
    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllNotifications() {
        const notifications = await this.notificationService.getAllNotifications();
        const unreadCount = await this.notificationService.countUnread();
        return {
            success: true,
            data: notifications,
            unreadCount,
        };
    }

    // Đếm số thông báo chưa đọc
    @UseGuards(JwtAuthGuard)
    @Get('count')
    async countUnread() {
        const count = await this.notificationService.countUnread();
        return {
            success: true,
            count,
        };
    }

    // Tạo thông báo mới (được gọi từ backend user khi có đơn hàng mới)
    @Post()
    async createNotification(
        @Body() body: { title: string; message: string; type: string; orderId?: string },
    ) {
        const notification = await this.notificationService.createNotification(body);
        return {
            success: true,
            data: notification,
        };
    }

    // Đánh dấu đã đọc và xóa (khi admin click vào thông báo)
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async markAsReadAndDelete(@Param('id') id: string) {
        await this.notificationService.markAsReadAndDelete(id);
        return {
            success: true,
            message: 'Notification deleted',
        };
    }

    // Xóa tất cả thông báo đã đọc
    @UseGuards(JwtAuthGuard)
    @Delete()
    async deleteAllRead() {
        await this.notificationService.deleteAllRead();
        return {
            success: true,
            message: 'All read notifications deleted',
        };
    }
}
