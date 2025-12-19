import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';
import { ReviewService } from './ReviewService';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    @Get()
    async getAllReviews(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('rating') rating?: string,
        @Query('productId') productId?: string,
    ) {
        console.log('📋 GET /admin/reviews endpoint called with params:', { page, limit, search, rating, productId });
        return this.reviewService.getAllReviews({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            search,
            rating: rating ? parseInt(rating) : undefined,
            productId,
        });
    }

    @Get('stats')
    async getReviewStats() {
        console.log('📊 GET /admin/reviews/stats endpoint called');
        return this.reviewService.getReviewStats();
    }

    @Get(':id')
    async getReviewById(@Param('id') id: string) {
        return this.reviewService.getReviewById(id);
    }

    @Post(':id/reply')
    async replyToReview(
        @Param('id') id: string,
        @Body('comment') comment: string,
        @Request() req: any,
    ) {
        const adminId = req.user.sub; // JWT payload contains user ID in 'sub' field
        return this.reviewService.replyToReview(id, comment, adminId);
    }

    @Delete(':id')
    async deleteReview(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const adminId = req.user.sub; // JWT payload contains user ID in 'sub' field
        return this.reviewService.deleteReview(id, adminId);
    }
}