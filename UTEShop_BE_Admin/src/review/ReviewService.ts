import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/ReviewSchema';
import { User, UserDocument } from '../schemas/UserSchema';
import { Product, ProductDocument } from '../schemas/ProductSchema';

@Injectable()
export class ReviewService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async getAllReviews(params: {
        page?: number;
        limit?: number;
        search?: string;
        rating?: number;
        productId?: string;
    }) {
        const { page = 1, limit = 10, search, rating, productId } = params;
        const skip = (page - 1) * limit;

        // Build filter - handle both old and new review formats
        const filter: any = {
            $or: [
                { isDeleted: { $ne: true } }, // New format
                { isDeleted: { $exists: false } }, // Old format without isDeleted field
            ]
        };

        if (rating) {
            filter.rating = rating;
        }

        if (productId) {
            filter.product = new Types.ObjectId(productId);
        }

        if (search) {
            filter.$or = [
                { 'comment': { $regex: search, $options: 'i' } },
                { 'adminReply.comment': { $regex: search, $options: 'i' } }
            ];
        }

        console.log('🔍 Searching for reviews with filter:', filter);

        const [reviews, total] = await Promise.all([
            this.reviewModel
                .find(filter)
                .populate('user', 'name email avatarUrl')
                .populate('product', 'name images')
                .populate('adminReply.admin', 'name email')
                .populate('deletedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.reviewModel.countDocuments(filter)
        ]);

        console.log('🔍 Found reviews:', reviews.length, 'Total:', total);
        console.log('🔍 Sample review:', reviews[0]);

        return {
            reviews,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getReviewById(id: string) {
        const review = await this.reviewModel
            .findById(id)
            .populate('user', 'name email avatarUrl')
            .populate('product', 'name images')
            .populate('adminReply.admin', 'name email')
            .populate('deletedBy', 'name email')
            .lean();

        if (!review) {
            throw new Error('Review không tồn tại');
        }

        return review;
    }

    async replyToReview(reviewId: string, replyComment: string, adminId: string) {
        const review = await this.reviewModel.findById(reviewId);

        if (!review) {
            throw new Error('Review không tồn tại');
        }

        if (review.isDeleted) {
            throw new Error('Không thể trả lời review đã bị xóa');
        }

        // Update review with admin reply
        review.adminReply = {
            comment: replyComment,
            admin: adminId,
            repliedAt: new Date()
        };

        await review.save();

        // Return populated review
        return this.getReviewById(reviewId);
    }

    async deleteReview(reviewId: string, adminId: string) {
        const review = await this.reviewModel.findById(reviewId);

        if (!review) {
            throw new Error('Review không tồn tại');
        }

        if (review.isDeleted) {
            throw new Error('Review đã bị xóa trước đó');
        }

        // Soft delete
        review.isDeleted = true;
        review.deletedBy = adminId;
        review.deletedAt = new Date();

        await review.save();

        return { message: 'Xóa review thành công' };
    }

    async getReviewStats() {
        console.log('🔍 Getting review stats...');
        console.log('🔍 ReviewModel collection name:', this.reviewModel.collection.name);
        console.log('🔍 ReviewModel db:', this.reviewModel.db.name);

        // First, let's try to count all documents without any filter
        const totalCount = await this.reviewModel.countDocuments({});
        console.log('🔍 Total documents in reviews collection:', totalCount);

        const stats = await this.reviewModel.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    },
                    totalReplied: {
                        $sum: {
                            $cond: [{ $ifNull: ['$adminReply', false] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: [],
            totalReplied: 0
        };

        // Calculate rating distribution
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        result.ratingDistribution.forEach((rating: number) => {
            ratingCounts[rating]++;
        });

        const finalStats = {
            totalReviews: result.totalReviews,
            averageRating: Math.round(result.averageRating * 10) / 10,
            ratingDistribution: ratingCounts,
            totalReplied: result.totalReplied,
            replyRate: result.totalReviews > 0 ? Math.round((result.totalReplied / result.totalReviews) * 100) : 0
        };

        console.log('✅ Review stats calculated:', finalStats);
        return finalStats;
    }
}