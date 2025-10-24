import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/product.js';
import Category from '../src/models/category.js';
import Brand from '../src/models/brand.js';
import elasticsearchService from '../src/services/elasticsearchService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fashion_store';

async function syncElasticsearch() {
    try {
        console.log('🚀 Bắt đầu đồng bộ Elasticsearch...\n');

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');

        // Check Elasticsearch connection
        const esConnected = await elasticsearchService.checkConnection();
        if (!esConnected) {
            throw new Error('Không thể kết nối Elasticsearch');
        }

        // Create index if not exists
        await elasticsearchService.createIndex();

        // Get all products with populated fields
        console.log('\n📦 Đang lấy dữ liệu sản phẩm từ MongoDB...');
        const products = await Product.find()
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        console.log(`✅ Đã lấy ${products.length} sản phẩm`);

        if (products.length === 0) {
            console.log('⚠️  Không có sản phẩm nào để đồng bộ');
            process.exit(0);
        }

        // Bulk index products
        console.log('\n⚡ Đang đồng bộ vào Elasticsearch...');
        const result = await elasticsearchService.bulkIndexProducts(products);

        if (result.errors) {
            console.error('❌ Có lỗi xảy ra khi đồng bộ');
        } else {
            console.log(`✅ Đã đồng bộ thành công ${products.length} sản phẩm`);
        }

        // Verify
        console.log('\n🔍 Kiểm tra kết quả...');
        const searchResult = await elasticsearchService.searchProducts({
            query: '',
            page: 1,
            limit: 1
        });
        console.log(`✅ Tổng số sản phẩm trong Elasticsearch: ${searchResult.total}`);

        console.log('\n✨ Hoàn thành đồng bộ!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

syncElasticsearch();

