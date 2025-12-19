import mongoose from "mongoose";
import dotenv from "dotenv";
import Review from "./src/models/review.js";
import User from "./src/models/user.js";
import Product from "./src/models/product.js";

dotenv.config();

const sampleReviews = [
    {
        userName: "Nguyễn Thị Lan",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        rating: 5,
        comment: "Sản phẩm chất lượng tuyệt vời, giao hàng nhanh chóng. Tôi rất hài lòng!",
        productName: "Son môi L'Oréal"
    },
    {
        userName: "Trần Minh Anh",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        rating: 5,
        comment: "Mỹ phẩm chính hãng, giá cả hợp lý. Sẽ ủng hộ shop lâu dài.",
        productName: "Kem dưỡng da"
    },
    {
        userName: "Lê Thị Hương",
        userAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop",
        rating: 5,
        comment: "Dịch vụ chăm sóc khách hàng tốt, tư vấn nhiệt tình. Rất đáng tin cậy!",
        productName: "Serum Vitamin C"
    },
    {
        userName: "Phạm Văn Nam",
        userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
        rating: 4,
        comment: "Sản phẩm tốt, đóng gói cẩn thận. Sẽ mua lại lần nữa.",
        productName: "Kem chống nắng"
    },
    {
        userName: "Hoàng Thị Mai",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
        rating: 5,
        comment: "Chất lượng vượt mong đợi, giá cả phải chăng. Rất推荐!",
        productName: "Sữa rửa mặt"
    },
    {
        userName: "Đỗ Quang Huy",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        rating: 4,
        comment: "Sản phẩm đúng như mô tả, shop tư vấn rất nhiệt tình.",
        productName: "Mặt nạ dưỡng da"
    }
];

const seedReviews = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing reviews
        await Review.deleteMany({});
        console.log("🗑️  Cleared existing reviews");

        // Get users and products
        const users = await User.find().limit(10);
        const products = await Product.find().limit(20);

        if (users.length === 0) {
            console.log("❌ No users found. Please seed users first.");
            return;
        }

        if (products.length === 0) {
            console.log("❌ No products found. Please seed products first.");
            return;
        }

        console.log(`👥 Found ${users.length} users`);
        console.log(`📦 Found ${products.length} products`);

        // Create reviews
        const reviewsToCreate = sampleReviews.map((sample, index) => {
            const randomUser = users[index % users.length];
            const randomProduct = products[index % products.length];

            return {
                user: randomUser._id,
                product: randomProduct._id,
                rating: sample.rating,
                comment: sample.comment,
                order: new mongoose.Types.ObjectId(), // Create unique order ID to avoid duplicate key error
                // Update user info for display
                userName: sample.userName,
                userAvatar: sample.userAvatar,
                productName: randomProduct.name
            };
        });

        const createdReviews = await Review.insertMany(reviewsToCreate);
        console.log(`✅ Created ${createdReviews.length} reviews`);

        // Update user names and avatars for display
        for (let i = 0; i < createdReviews.length; i++) {
            const review = createdReviews[i];
            const sample = sampleReviews[i];

            // Update user info if not exists
            const user = await User.findById(review.user);
            if (!user.name) {
                user.name = sample.userName;
            }
            if (!user.avatarUrl) {
                user.avatarUrl = sample.userAvatar;
            }
            await user.save();
        }

        console.log("✅ Updated user information");
        console.log("🎉 Review seeding completed successfully!");

    } catch (error) {
        console.error("❌ Error seeding reviews:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
};

// Run the seed function
seedReviews();