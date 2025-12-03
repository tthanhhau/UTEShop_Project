import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/ReviewSchema';
import { User, UserDocument } from '../schemas/UserSchema';
import { Product, ProductDocument } from '../schemas/ProductSchema';
import { Order, OrderDocument } from '../schemas/OrderSchema';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ReviewService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private httpService: HttpService,
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

        // Build filter - chỉ lấy reviews chưa bị xóa
        const filter: any = {
            isDeleted: { $ne: true }  // Không hiển thị reviews đã bị xóa
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
        console.log('🔍 User model:', this.userModel.modelName);
        console.log('🔍 Product model:', this.productModel.modelName);

        // Try using aggregation with $lookup instead of populate
        const reviewsPipeline: any[] = [
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        { $project: { name: 1, email: 1, avatarUrl: 1, phone: 1, address: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'product',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'categories',
                                localField: 'category',
                                foreignField: '_id',
                                as: 'category'
                            }
                        },
                        {
                            $lookup: {
                                from: 'brands',
                                localField: 'brand',
                                foreignField: '_id',
                                as: 'brand'
                            }
                        },
                        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                name: 1,
                                images: 1,
                                description: 1,
                                price: 1,
                                category: 1,
                                brand: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'adminReply.admin',
                    foreignField: '_id',
                    as: 'adminReply.admin',
                    pipeline: [
                        { $project: { name: 1, email: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'deletedBy',
                    foreignField: '_id',
                    as: 'deletedBy',
                    pipeline: [
                        { $project: { name: 1, email: 1 } }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const [reviews, total] = await Promise.all([
            this.reviewModel.aggregate(reviewsPipeline),
            this.reviewModel.countDocuments(filter)
        ]);

        // Unwind arrays from lookup
        const formattedReviews = reviews.map(review => {
            const productData = review.product && review.product.length > 0 ? review.product[0] : null;
            return {
                ...review,
                user: review.user && review.user.length > 0 ? review.user[0] : null,
                product: productData,
                'adminReply.admin': review['adminReply.admin'] && review['adminReply.admin'].length > 0 ? review['adminReply.admin'][0] : null,
                deletedBy: review.deletedBy && review.deletedBy.length > 0 ? review.deletedBy[0] : null
            };
        });

        console.log('🔍 Found reviews:', formattedReviews.length, 'Total:', total);
        if (formattedReviews.length > 0) {
            console.log('🔍 Sample review:', JSON.stringify(formattedReviews[0], null, 2));
            console.log('🔍 Sample user:', JSON.stringify(formattedReviews[0].user, null, 2));
            console.log('🔍 Sample product:', JSON.stringify(formattedReviews[0].product, null, 2));
        }

        return {
            reviews: formattedReviews,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getReviewById(id: string) {
        // Try using aggregation instead of populate
        const reviewPipeline: any[] = [
            { $match: { _id: new Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        { $project: { name: 1, email: 1, avatarUrl: 1, phone: 1, address: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'product',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'categories',
                                localField: 'category',
                                foreignField: '_id',
                                as: 'category'
                            }
                        },
                        {
                            $lookup: {
                                from: 'brands',
                                localField: 'brand',
                                foreignField: '_id',
                                as: 'brand'
                            }
                        },
                        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                name: 1,
                                images: 1,
                                description: 1,
                                price: 1,
                                category: 1,
                                brand: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'adminReply.admin',
                    foreignField: '_id',
                    as: 'adminReply.admin',
                    pipeline: [
                        { $project: { name: 1, email: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'deletedBy',
                    foreignField: '_id',
                    as: 'deletedBy',
                    pipeline: [
                        { $project: { name: 1, email: 1 } }
                    ]
                }
            }
        ];

        const reviews = await this.reviewModel.aggregate(reviewPipeline);

        if (reviews.length === 0) {
            throw new Error('Review không tồn tại');
        }

        // Unwind arrays from lookup
        const productData = reviews[0].product && reviews[0].product.length > 0 ? reviews[0].product[0] : null;
        const review = {
            ...reviews[0],
            user: reviews[0].user && reviews[0].user.length > 0 ? reviews[0].user[0] : null,
            product: productData,
            'adminReply.admin': reviews[0]['adminReply.admin'] && reviews[0]['adminReply.admin'].length > 0 ? reviews[0]['adminReply.admin'][0] : null,
            deletedBy: reviews[0].deletedBy && reviews[0].deletedBy.length > 0 ? reviews[0].deletedBy[0] : null
        };

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
        console.log(`🔍 [ADMIN] Starting deleteReview for reviewId: ${reviewId}`);

        const review = await this.reviewModel.findById(reviewId);
        console.log(`🔍 [ADMIN] Found review:`, review ? 'YES' : 'NO');

        if (!review) {
            throw new Error('Review không tồn tại');
        }

        // Soft delete - đánh dấu isDeleted thay vì xóa vĩnh viễn
        review.isDeleted = true;
        review.deletedBy = adminId; // adminId đã là string
        review.deletedAt = new Date();
        await review.save();
        console.log(`✅ [ADMIN] Successfully soft-deleted review ${reviewId} from admin database`);

        // Cập nhật Order.reviewStatus nếu có order
        if (review.order) {
            await this.orderModel.findByIdAndUpdate(review.order, {
                reviewStatus: 'review_deleted',
                reviewDeletedAt: new Date()
            });
            console.log(`✅ [ADMIN] Updated order ${review.order} reviewStatus to 'review_deleted'`);
        }

        // Không cần gọi user backend vì admin và user dùng chung database
        console.log(`✅ [ADMIN] Review deletion completed`);

        return { message: 'Xóa review thành công' };
    }

    async getReviewStats() {
        console.log('🔍 Getting review stats...');
        console.log('🔍 ReviewModel collection name:', this.reviewModel.collection.name);
        console.log('🔍 ReviewModel db:', this.reviewModel.db.name);

        // Check if users and products collections exist and have data
        const userCount = await this.userModel.countDocuments({});
        const productCount = await this.productModel.countDocuments({});
        console.log('🔍 Total documents in users collection:', userCount);
        console.log('🔍 Total documents in products collection:', productCount);

        // First, let's try to count all documents without any filter
        const totalCount = await this.reviewModel.countDocuments({});
        console.log('🔍 Total documents in reviews collection:', totalCount);

        // Check a sample review to see the actual data
        const sampleReview = await this.reviewModel.findOne({}).lean();
        if (sampleReview) {
            console.log('🔍 Sample review data:', JSON.stringify(sampleReview, null, 2));
        }

        const stats = await this.reviewModel.aggregate([
            // Chỉ tính reviews chưa bị xóa
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