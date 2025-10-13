import elasticsearchService from '../services/elasticsearchService.js';
import Product from '../models/product.js';

// Tìm kiếm sản phẩm với Elasticsearch
export const searchProducts = async (req, res) => {
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
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice),
            page: parseInt(page),
            limit: parseInt(limit),
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
        console.error('❌ Lỗi tìm kiếm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm sản phẩm',
            error: error.message
        });
    }
};

// Gợi ý tìm kiếm (autocomplete)
export const suggestProducts = async (req, res) => {
    try {
        const { q = '', limit = 5 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const suggestions = await elasticsearchService.suggest(q, parseInt(limit));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('❌ Lỗi gợi ý:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy gợi ý',
            error: error.message
        });
    }
};

// Đồng bộ một sản phẩm vào Elasticsearch
export const syncProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const success = await elasticsearchService.indexProduct(product);

        res.json({
            success,
            message: success ? 'Đã đồng bộ sản phẩm' : 'Lỗi đồng bộ sản phẩm'
        });
    } catch (error) {
        console.error('❌ Lỗi đồng bộ sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đồng bộ sản phẩm',
            error: error.message
        });
    }
};

// Xóa sản phẩm khỏi Elasticsearch
export const deleteProductFromES = async (req, res) => {
    try {
        const { productId } = req.params;

        const success = await elasticsearchService.deleteProduct(productId);

        res.json({
            success,
            message: success ? 'Đã xóa sản phẩm khỏi Elasticsearch' : 'Lỗi xóa sản phẩm'
        });
    } catch (error) {
        console.error('❌ Lỗi xóa sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
};

// Lấy facets (bộ lọc)
export const getFacets = async (req, res) => {
    try {
        const result = await elasticsearchService.searchProducts({
            query: '',
            page: 1,
            limit: 0 // Chỉ lấy facets, không cần products
        });

        res.json({
            success: true,
            data: result.facets
        });
    } catch (error) {
        console.error('❌ Lỗi lấy facets:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy bộ lọc',
            error: error.message
        });
    }
};

// Kiểm tra trạng thái Elasticsearch
export const healthCheck = async (req, res) => {
    try {
        const isConnected = await elasticsearchService.checkConnection();

        res.json({
            success: isConnected,
            message: isConnected ? 'Elasticsearch đang hoạt động' : 'Không thể kết nối Elasticsearch'
        });
    } catch (error) {
        console.error('❌ Lỗi health check:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra Elasticsearch',
            error: error.message
        });
    }
};

