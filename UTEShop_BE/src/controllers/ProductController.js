import Product from "../models/product.js";
import Review from "../models/review.js";
import Order from "../models/order.js";
import mongoose from "mongoose";
import elasticsearchService from "../services/elasticsearchService.js";

// Lấy 4 khối sản phẩm cho trang chủ
export const getHomeBlocks = async (req, res) => {
    try {
        const [newest, bestSelling, mostViewed, topDiscount, totalCounts] = await Promise.all([
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ soldCount: -1 })
                .limit(6)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ viewCount: -1 })
                .limit(8)
                .lean(),
            Product.find()
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .sort({ discountPercentage: -1 })
                .limit(4)
                .lean(),
            // Đếm tổng số sản phẩm cho mỗi category
            Promise.all([
                Product.countDocuments().lean(), // total newest
                Product.countDocuments({ soldCount: { $gt: 0 } }).lean(), // total bestselling
                Product.countDocuments({ viewCount: { $gt: 0 } }).lean(), // total mostviewed
                Product.countDocuments({ discountPercentage: { $gt: 0 } }).lean() // total discount
            ])
        ]);

        const [totalNewest, totalBestSelling, totalMostViewed, totalDiscount] = totalCounts;

        res.json({
            newest,
            bestSelling,
            mostViewed,
            topDiscount,
            totals: {
                newest: totalNewest,
                bestSelling: totalBestSelling,
                mostViewed: totalMostViewed,
                topDiscount: totalDiscount
            }
        });
    } catch (err) {
        console.error('Error in getHomeBlocks:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Lấy sản phẩm phân trang + sort
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = "newest", category, search, brand, minPrice, maxPrice, minRating } = req.query;

        const sortMap = {
            newest: { createdAt: -1 },
            "best-selling": { soldCount: -1 },
            "most-viewed": { viewCount: -1 },
            "top-discount": { discountPercentage: -1 },
            "price-asc": { price: 1 },
            "price-desc": { price: -1 },
            "alpha-asc": { name: 1 },
            "alpha-desc": { name: -1 },
        };

        const sortOption = sortMap[sort] || sortMap["newest"];

        // Build filter
        const filter = {};
        // Convert string to ObjectId for category and brand
        if (category) {
            filter.category = mongoose.Types.ObjectId.isValid(category)
                ? new mongoose.Types.ObjectId(category)
                : category;
        }
        if (brand) {
            filter.brand = mongoose.Types.ObjectId.isValid(brand)
                ? new mongoose.Types.ObjectId(brand)
                : brand;
        }
        // Price range filter based on discounted price = price * (1 - discountPercentage/100)
        const parsedMinPrice = Number.isFinite(parseFloat(minPrice)) ? parseFloat(minPrice) : undefined;
        const parsedMaxPrice = Number.isFinite(parseFloat(maxPrice)) ? parseFloat(maxPrice) : undefined;
        if (parsedMinPrice !== undefined || parsedMaxPrice !== undefined) {
            const effectivePriceExpr = {
                $multiply: [
                    "$price",
                    { $subtract: [1, { $divide: ["$discountPercentage", 100] }] }
                ]
            };
            const comparisons = [];
            if (parsedMinPrice !== undefined) {
                comparisons.push({ $gte: [effectivePriceExpr, parsedMinPrice] });
            }
            if (parsedMaxPrice !== undefined) {
                comparisons.push({ $lte: [effectivePriceExpr, parsedMaxPrice] });
            }
            if (comparisons.length === 1) {
                filter.$expr = comparisons[0];
            } else if (comparisons.length === 2) {
                filter.$expr = { $and: comparisons };
            }
        }

        let esMatchedIds = null;
        if (search) {
            // Dùng Elasticsearch để tìm không phân biệt dấu, sau đó lọc theo _id trong MongoDB
            try {
                const esResult = await elasticsearchService.searchProducts({
                    query: search,
                    page: 1,
                    limit: 1000,
                    sort: 'relevance'
                });
                esMatchedIds = esResult.products.map(p => new mongoose.Types.ObjectId(p._id));
                // Nếu không có kết quả khớp, trả về rỗng ngay
                if (esMatchedIds.length === 0) {
                    return res.json({
                        page: 1,
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        items: []
                    });
                }
                filter._id = { $in: esMatchedIds };
            } catch (e) {
                // fallback: regex (vẫn phân biệt dấu)
                filter.name = { $regex: search, $options: 'i' };
            }
        }

        // Rating filter (minimum average rating)
        let ratingMatchedIds = null;
        const parsedMinRating = Number.isFinite(parseFloat(minRating)) ? parseFloat(minRating) : undefined;
        if (parsedMinRating !== undefined && parsedMinRating > 0) {
            const ratingAgg = await Review.aggregate([
                {
                    $group: {
                        _id: "$product",
                        avgRating: { $avg: "$rating" }
                    }
                },
                { $match: { avgRating: { $gte: parsedMinRating } } },
                { $project: { _id: 1 } }
            ]);
            ratingMatchedIds = ratingAgg.map(doc => doc._id);
            // Nếu không có sản phẩm nào đạt rating
            if (ratingMatchedIds.length === 0) {
                return res.json({
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    totalPages: 0,
                    items: []
                });
            }
            if (filter._id && filter._id.$in) {
                // Giao (intersection) giữa ES ids và rating ids
                const set = new Set(ratingMatchedIds.map(id => id.toString()));
                filter._id.$in = filter._id.$in.filter(id => set.has(id.toString()));
                if (filter._id.$in.length === 0) {
                    return res.json({
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        items: []
                    });
                }
            } else {
                filter._id = { $in: ratingMatchedIds };
            }
        }

        const pageNum = parseInt(page);
        const pageSize = parseInt(limit);

        const isAlphaSort = sort === 'alpha-asc' || sort === 'alpha-desc';
        const [items, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .populate('brand', 'name logo')
                .collation(isAlphaSort ? { locale: 'vi', strength: 1 } : undefined)
                .sort(sortOption)
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Product.countDocuments(filter),
        ]);

        res.json({
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items,
        });
    } catch (err) {
        console.error('Error in getProducts:', err);
        res.status(500).json({ message: "Server error" });
    }
};

// Tăng view count
export const increaseView = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📈 Increasing view count for product: ${id} at ${new Date().toISOString()}`);

        // Sử dụng findOneAndUpdate với upsert: false để đảm bảo chỉ update 1 lần
        const product = await Product.findOneAndUpdate(
            { _id: id },
            { $inc: { viewCount: 1 } },
            { new: true, upsert: false }
        ).populate('category', 'name').populate('brand', 'name logo');

        if (!product) {
            console.log(`❌ Product not found: ${id}`);
            return res.status(404).json({ message: "Product not found" });
        }

        console.log(`✅ View count increased to: ${product.viewCount} for product: ${product.name}`);
        res.json(product);
    } catch (error) {
        console.error('Error in increaseView:', error);
        res.status(500).json({ message: error.message });
    }
};

// Tăng sold count
export const increaseSold = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body; // số lượng mua
        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { soldCount: quantity || 1 } }, // tăng theo số lượng
            { new: true }
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy thống kê sản phẩm (số khách mua, số review)
export const getProductStats = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📊 Getting product stats for:', id);

        const [product, reviewStats, purchaseStats] = await Promise.all([
            Product.findById(id).populate('category', 'name').populate('brand', 'name logo'),
            Review.aggregate([
                { $match: { product: new mongoose.Types.ObjectId(id) } },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        averageRating: { $avg: "$rating" },
                        ratingDistribution: {
                            $push: "$rating"
                        }
                    }
                }
            ]),
            Order.aggregate([
                { $match: { status: "delivered", 'items.product': new mongoose.Types.ObjectId(id) } }, // delivered orders
                { $unwind: "$items" },
                { $match: { 'items.product': new mongoose.Types.ObjectId(id) } },
                {
                    $group: {
                        _id: "$user",
                        totalQuantity: { $sum: "$items.quantity" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        uniqueBuyers: { $sum: 1 },
                        totalQuantitySold: { $sum: "$totalQuantity" }
                    }
                }
            ])
        ]);

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Tính phân bố rating
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (reviewStats.length > 0 && reviewStats[0].ratingDistribution) {
            reviewStats[0].ratingDistribution.forEach(rating => {
                ratingDistribution[rating]++;
            });
        }

        const stats = {
            product: {
                _id: product._id,
                name: product.name,
                soldCount: product.soldCount,
                viewCount: product.viewCount,
                stock: product.stock
            },
            reviews: {
                totalReviews: reviewStats.length > 0 ? reviewStats[0].totalReviews : 0,
                averageRating: reviewStats.length > 0 ? Math.round(reviewStats[0].averageRating * 10) / 10 : 0,
                ratingDistribution
            },
            purchases: {
                uniqueBuyers: purchaseStats.length > 0 ? purchaseStats[0].uniqueBuyers : 0,
                totalQuantitySold: purchaseStats.length > 0 ? purchaseStats[0].totalQuantitySold : 0
            }
        };

        console.log('✅ Product stats result:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Error in getProductStats:', error);
        res.status(500).json({ message: "Server error" });
    }
};
