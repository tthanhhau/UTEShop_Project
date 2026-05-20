import express from 'express';
import elasticsearchService from '../services/elasticsearchService.js';
const router = express.Router();
// Health check
router.get('/health', async (req, res) => {
    try {
        const isConnected = await elasticsearchService.checkConnection();
        if (isConnected) {
            res.json({
                success: true,
                message: 'Elasticsearch đang hoạt động'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Không thể kết nối đến Elasticsearch'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Tìm kiếm sản phẩm
router.get('/search', async (req, res) => {
    try {
        const {
            q = '',
            category = '',
            brand = '',
            minPrice = 0,
            maxPrice = 999999999,
            page = 1,
            limit = 12,
            sort = 'relevance'
        } = req.query;

        const result = await elasticsearchService.searchProducts({
            query: q,
            category,
            brand,
            minPrice: Number(minPrice),
            maxPrice: Number(maxPrice),
            page: Number(page),
            limit: Number(limit),
            sort
        });

        res.json({
            success: true,
            data: result.products,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            },
            facets: result.facets
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm sản phẩm',
            error: error.message
        });
    }
});

// Autocomplete/Suggest
router.get('/suggest', async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;

        if (!q || q.length < 1) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await elasticsearchService.suggest(q, Number(limit));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Suggest error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy gợi ý tìm kiếm',
            error: error.message
        });
    }
});

// Đồng bộ sản phẩm vào Elasticsearch (Admin)
router.post('/sync/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const Product = (await import('../models/product.js')).default;

        const product = await Product.findById(productId)
            .populate('category', 'name')
            .populate('brand', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không tồn tại'
            });
        }

        const success = await elasticsearchService.indexProduct(product);

        if (success) {
            res.json({
                success: true,
                message: 'Đồng bộ sản phẩm thành công'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đồng bộ sản phẩm'
            });
        }
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đồng bộ sản phẩm',
            error: error.message
        });
    }
});

// Đồng bộ TẤT CẢ sản phẩm vào Elasticsearch (Admin)
router.post('/sync-all', async (req, res) => {
    try {
        // Dynamic import để tránh circular dependency
        const Product = (await import('../models/product.js')).default;

        console.log('🚀 Bắt đầu đồng bộ tất cả sản phẩm...');

        // Check Elasticsearch connection
        const isConnected = await elasticsearchService.checkConnection();
        if (!isConnected) {
            return res.status(500).json({
                success: false,
                message: 'Không thể kết nối đến Elasticsearch'
            });
        }

        // Create index if not exists
        await elasticsearchService.createIndex();

        // Get all products
        const products = await Product.find()
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        if (products.length === 0) {
            return res.json({
                success: true,
                message: 'Không có sản phẩm nào để đồng bộ',
                count: 0
            });
        }

        // Bulk index
        const result = await elasticsearchService.bulkIndexProducts(products);

        console.log(`✅ Đã đồng bộ ${products.length} sản phẩm`);

        res.json({
            success: true,
            message: `Đã đồng bộ ${products.length} sản phẩm vào Elasticsearch`,
            count: products.length,
            hasErrors: result.errors || false
        });
    } catch (error) {
        console.error('Sync all error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đồng bộ sản phẩm',
            error: error.message
        });
    }
});

// Xóa sản phẩm khỏi Elasticsearch (Admin)
router.delete('/delete/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const success = await elasticsearchService.deleteProduct(productId);

        if (success) {
            res.json({
                success: true,
                message: 'Xóa sản phẩm khỏi Elasticsearch thành công'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa sản phẩm khỏi Elasticsearch'
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
});

// Bằng ES modules
export default router;
