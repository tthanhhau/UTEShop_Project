import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/product.js';
import elasticsearchService from '../src/services/elasticsearchService.js';

dotenv.config();

const syncElasticsearchProducts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shop');
        console.log('✅ Connected to MongoDB');

        // Check Elasticsearch connection
        const esConnected = await elasticsearchService.checkConnection();
        if (!esConnected) {
            console.error('❌ Cannot connect to Elasticsearch');
            return;
        }

        // Get all active products from MongoDB
        const activeProducts = await Product.find({ isActive: true })
            .populate('category', 'name')
            .populate('brand', 'name')
            .lean();

        console.log(`📦 Found ${activeProducts.length} active products in MongoDB`);

        // Bulk index all active products to Elasticsearch
        if (activeProducts.length > 0) {
            const result = await elasticsearchService.bulkIndexProducts(activeProducts);
            console.log(`✅ Indexed ${activeProducts.length} products to Elasticsearch`);

            if (result.errors) {
                console.log('⚠️ Some errors occurred during indexing');
            }
        }

        // Get all inactive products to remove from Elasticsearch
        const inactiveProducts = await Product.find({ isActive: false }).lean();

        if (inactiveProducts.length > 0) {
            console.log(`🗑️ Found ${inactiveProducts.length} inactive products`);

            // Remove inactive products from Elasticsearch
            for (const product of inactiveProducts) {
                await elasticsearchService.deleteProduct(product._id);
            }

            console.log(`✅ Removed ${inactiveProducts.length} inactive products from Elasticsearch`);
        }

        console.log('✅ Elasticsearch synchronization completed');

    } catch (error) {
        console.error('❌ Error syncing Elasticsearch:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run sync
syncElasticsearchProducts();