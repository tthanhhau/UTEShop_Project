import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../src/models/review.js';
import Order from '../src/models/order.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Update order review status based on existing reviews
const updateOrderReviewStatus = async () => {
    try {
        console.log('🔄 Starting to update order review status...');

        // Find all reviews that have an order reference
        const reviewsWithOrder = await Review.find({
            order: { $exists: true, $ne: null },
            isDeleted: { $ne: true } // Only consider non-deleted reviews
        });

        console.log(`📊 Found ${reviewsWithOrder.length} reviews with order reference`);

        let updatedCount = 0;

        // Update each order's review status
        for (const review of reviewsWithOrder) {
            try {
                const order = await Order.findById(review.order);

                if (order) {
                    // Only update if the order doesn't already have a review status
                    if (!order.reviewStatus || order.reviewStatus === 'pending') {
                        await Order.findByIdAndUpdate(review.order, {
                            reviewStatus: 'reviewed',
                            reviewedAt: review.createdAt
                        });

                        console.log(`✅ Updated order ${review.order} review status to 'reviewed'`);
                        updatedCount++;
                    } else {
                        console.log(`⚠️ Order ${review.order} already has review status: ${order.reviewStatus}`);
                    }
                } else {
                    console.log(`❌ Order ${review.order} not found for review ${review._id}`);
                }
            } catch (error) {
                console.error(`❌ Error updating order ${review.order}:`, error.message);
            }
        }

        console.log(`🎉 Completed! Updated ${updatedCount} orders with review status`);

        // Also check for orders that might have deleted reviews
        const deletedReviews = await Review.find({
            order: { $exists: true, $ne: null },
            isDeleted: true
        });

        console.log(`📊 Found ${deletedReviews.length} deleted reviews with order reference`);

        let deletedUpdatedCount = 0;

        for (const review of deletedReviews) {
            try {
                const order = await Order.findById(review.order);

                if (order) {
                    // Only update if the order doesn't already have a review_deleted status
                    if (order.reviewStatus !== 'review_deleted') {
                        await Order.findByIdAndUpdate(review.order, {
                            reviewStatus: 'review_deleted',
                            reviewDeletedAt: review.deletedAt
                        });

                        console.log(`✅ Updated order ${review.order} review status to 'review_deleted'`);
                        deletedUpdatedCount++;
                    } else {
                        console.log(`⚠️ Order ${review.order} already has review status: ${order.reviewStatus}`);
                    }
                } else {
                    console.log(`❌ Order ${review.order} not found for deleted review ${review._id}`);
                }
            } catch (error) {
                console.error(`❌ Error updating order ${review.order} for deleted review:`, error.message);
            }
        }

        console.log(`🎉 Completed! Updated ${deletedUpdatedCount} orders with review_deleted status`);

    } catch (error) {
        console.error('❌ Error updating order review status:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await updateOrderReviewStatus();

    console.log('🏁 Script completed');
    process.exit(0);
};

// Run the script
main();