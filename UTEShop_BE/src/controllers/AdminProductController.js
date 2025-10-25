import Product from "../models/product.js";
import Category from "../models/category.js";
import Brand from "../models/brand.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Lấy tất cả products với phân trang và tìm kiếm
export const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        category = '',
        brand = '',
        sort = 'newest'
    } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);

    // Build filter
    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    // Check if we need to sort by price (which requires aggregation)
    const isPriceSort = sort === 'price-asc' || sort === 'price-desc';

    // Sort options
    const sortMap = {
        newest: { createdAt: -1 },
        'best-selling': { soldCount: -1 },
        'most-viewed': { viewCount: -1 },
        'top-discount': { discountPercentage: -1 },
        'name-asc': { name: 1 },
        'name-desc': { name: -1 }
    };

    const sortOption = sortMap[sort] || sortMap.newest;

    let products, total;

    if (isPriceSort) {
        // Use aggregation pipeline for price sorting to calculate final price
        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    finalPrice: {
                        $multiply: [
                            "$price",
                            { $subtract: [1, { $divide: ["$discountPercentage", 100] }] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ["$category", 0] },
                    brand: { $arrayElemAt: ["$brand", 0] }
                }
            },
            {
                $sort: sort === 'price-asc' ? { finalPrice: 1 } : { finalPrice: -1 }
            }
        ];

        const [aggregationResult, countResult] = await Promise.all([
            Product.aggregate([
                ...pipeline,
                { $skip: (pageNum - 1) * pageSize },
                { $limit: pageSize }
            ]),
            Product.aggregate([
                { $match: filter },
                { $count: "total" }
            ])
        ]);

        products = aggregationResult;
        total = countResult[0]?.total || 0;
    } else {
        // Regular query for non-price sorting
        const [productsResult, totalResult] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .populate('brand', 'name')
                .sort(sortOption)
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Product.countDocuments(filter)
        ]);

        products = productsResult;
        total = totalResult;
    }

    // Tính giá sau giảm cho mỗi sản phẩm
    const productsWithDiscount = products.map(product => ({
        ...product,
        discountedPrice: product.discountPercentage > 0
            ? Math.round(product.price * (1 - product.discountPercentage / 100))
            : product.price
    }));

    res.status(200).json({
        success: true,
        data: productsWithDiscount,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / pageSize),
            totalItems: total,
            itemsPerPage: pageSize
        }
    });
});

// Lấy product theo ID
export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('brand', 'name');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Sản phẩm không tồn tại'
        });
    }

    // Tính giá sau giảm
    const discountedPrice = product.discountPercentage > 0
        ? Math.round(product.price * (1 - product.discountPercentage / 100))
        : product.price;

    res.status(200).json({
        success: true,
        data: {
            ...product.toObject(),
            discountedPrice
        }
    });
});

// Tạo product mới
export const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        stock,
        images,
        category,
        brand,
        discountPercentage = 0
    } = req.body;

    // Kiểm tra category và brand tồn tại
    const [categoryExists, brandExists] = await Promise.all([
        Category.findById(category),
        Brand.findById(brand)
    ]);

    if (!categoryExists) {
        return res.status(400).json({
            success: false,
            message: 'Danh mục không tồn tại'
        });
    }

    if (!brandExists) {
        return res.status(400).json({
            success: false,
            message: 'Thương hiệu không tồn tại'
        });
    }

    const product = await Product.create({
        name,
        description,
        price,
        stock,
        images: images || [],
        category,
        brand,
        discountPercentage,
        isActive: true,  // Mặc định là active khi tạo mới
        isVisible: true  // Mặc định là visible khi tạo mới
    });

    const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name')
        .populate('brand', 'name');

    res.status(201).json({
        success: true,
        data: populatedProduct,
        message: 'Tạo sản phẩm thành công'
    });
});

// Cập nhật product
export const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        stock,
        images,
        category,
        brand,
        discountPercentage
    } = req.body;

    // Kiểm tra product có tồn tại
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Sản phẩm không tồn tại'
        });
    }

    // Kiểm tra category và brand tồn tại (nếu có thay đổi)
    if (category && category !== product.category.toString()) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }
    }

    if (brand && brand !== product.brand.toString()) {
        const brandExists = await Brand.findById(brand);
        if (!brandExists) {
            return res.status(400).json({
                success: false,
                message: 'Thương hiệu không tồn tại'
            });
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name,
            description,
            price,
            stock,
            images,
            category,
            brand,
            discountPercentage
        },
        { new: true, runValidators: true }
    ).populate('category', 'name').populate('brand', 'name');

    res.status(200).json({
        success: true,
        data: updatedProduct,
        message: 'Cập nhật sản phẩm thành công'
    });
});

// Xóa product
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Sản phẩm không tồn tại'
        });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Xóa sản phẩm thành công'
    });
});

// Xóa nhiều products
export const deleteMultipleProducts = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn sản phẩm để xóa'
        });
    }

    const result = await Product.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} sản phẩm thành công`
    });
});

// Toggle discount status
export const toggleDiscount = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Sản phẩm không tồn tại'
        });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { discountPercentage: product.discountPercentage > 0 ? 0 : 10 }, // Toggle between 0 and 10%
        { new: true }
    ).populate('category', 'name').populate('brand', 'name');

    res.status(200).json({
        success: true,
        data: updatedProduct,
        message: `Đã ${updatedProduct.discountPercentage > 0 ? 'bật' : 'tắt'} giảm giá`
    });
});

// Toggle visibility status
export const toggleVisibility = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Sản phẩm không tồn tại'
        });
    }

    // Toggle visibility status - đồng bộ cả hai trường isActive và isVisible
    const newVisibilityStatus = !product.isVisible;
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            isVisible: newVisibilityStatus,
            isActive: newVisibilityStatus  // Đồng bộ hóa với isActive
        },
        { new: true }
    ).populate('category', 'name').populate('brand', 'name');

    res.status(200).json({
        success: true,
        data: updatedProduct,
        message: `Đã ${updatedProduct.isVisible ? 'hiển thị' : 'ẩn'} sản phẩm`
    });
});
