import Product from "../models/product.js";
import mongoose from "mongoose";

// Lấy sản phẩm tương tự
export const getSimilarProducts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 8 } = req.query;

        console.log('🔍 Getting similar products for:', productId);

        // Convert productId to ObjectId if needed
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Lấy thông tin sản phẩm hiện tại
        const currentProduct = await Product.findById(productObjectId)
            .populate('category', 'name')
            .populate('brand', 'name');

        if (!currentProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        const limitNum = parseInt(limit);

        // Tìm sản phẩm tương tự cùng category (cùng loại sản phẩm)
        let similarProducts = await Product.find({
            _id: { $ne: productObjectId }, // Loại trừ sản phẩm hiện tại
            category: currentProduct.category._id // Bắt buộc cùng loại sản phẩm
        })
            .populate('category', 'name')
            .populate('brand', 'name logo')
            .sort({ soldCount: -1, viewCount: -1 }) // Ưu tiên sản phẩm bán chạy và xem nhiều
            .limit(limitNum * 2) // Lấy nhiều hơn một chút để lọc/sắp xếp theo brand nếu có
            .lean();

        // Sắp xếp ưu tiên sản phẩm cùng thương hiệu lên đầu tiên
        if (currentProduct.brand) {
            similarProducts.sort((a, b) => {
                const aSameBrand = a.brand?._id?.toString() === currentProduct.brand._id.toString() ? 1 : 0;
                const bSameBrand = b.brand?._id?.toString() === currentProduct.brand._id.toString() ? 1 : 0;
                return bSameBrand - aSameBrand; // Đưa sản phẩm cùng brand lên đầu
            });
        }

        // Lấy đúng số lượng limit mong muốn
        similarProducts = similarProducts.slice(0, limitNum);

        console.log('✅ Found', similarProducts.length, 'similar products');

        res.json({
            currentProduct: {
                _id: currentProduct._id,
                name: currentProduct.name,
                category: currentProduct.category,
                brand: currentProduct.brand
            },
            similarProducts
        });
    } catch (error) {
        console.error('Error in getSimilarProducts:', error);
        res.status(500).json({ message: "Server error" });
    }
};
