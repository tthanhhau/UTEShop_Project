// Script để xóa index cũ và sync lại
import { Client } from '@opensearch-project/opensearch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const esUrl = process.env.ELASTICSEARCH_URL;
const indexName = process.env.ELASTICSEARCH_INDEX_PRODUCTS || 'uteshop_products';

const client = new Client({
    node: esUrl,
    ssl: { rejectUnauthorized: false }
});

function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

async function resync() {
    try {
        // Connect MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Import models
        await import('./src/models/category.js');
        await import('./src/models/brand.js');
        const Product = (await import('./src/models/product.js')).default;

        // Delete old index
        try {
            await client.indices.delete({ index: indexName });
            console.log(`✅ Đã xóa index ${indexName}`);
        } catch (e) {
            console.log('Index không tồn tại, bỏ qua');
        }

        // Create new index with mapping
        await client.indices.create({
            index: indexName,
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                    analysis: {
                        filter: { vn_ascii_folding: { type: 'asciifolding', preserve_original: true } },
                        analyzer: {
                            vn_analyzer: { type: 'custom', tokenizer: 'standard', filter: ['lowercase', 'vn_ascii_folding'] }
                        }
                    }
                },
                mappings: {
                    properties: {
                        name: { type: 'text', analyzer: 'vn_analyzer', fields: { keyword: { type: 'keyword' } } },
                        nameNoAccent: { type: 'text', analyzer: 'standard' },
                        description: { type: 'text', analyzer: 'vn_analyzer' },
                        price: { type: 'float' },
                        discountedPrice: { type: 'float' },
                        discountPercentage: { type: 'integer' },
                        stock: { type: 'integer' },
                        images: { type: 'keyword' },
                        category: {
                            type: 'object',
                            properties: {
                                _id: { type: 'keyword' },
                                name: { type: 'text', analyzer: 'vn_analyzer', fields: { keyword: { type: 'keyword' } } },
                                nameNoAccent: { type: 'text', analyzer: 'standard' }
                            }
                        },
                        brand: {
                            type: 'object',
                            properties: {
                                _id: { type: 'keyword' },
                                name: { type: 'text', analyzer: 'vn_analyzer', fields: { keyword: { type: 'keyword' } } },
                                nameNoAccent: { type: 'text', analyzer: 'standard' }
                            }
                        },
                        soldCount: { type: 'integer' },
                        viewCount: { type: 'integer' },
                        averageRating: { type: 'float' },
                        reviewCount: { type: 'integer' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' }
                    }
                }
            }
        });
        console.log(`✅ Đã tạo index ${indexName} mới`);

        // Get all products
        const products = await Product.find().populate('category', 'name').populate('brand', 'name').lean();
        console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

        // Bulk index
        const body = products.flatMap(product => [
            { index: { _index: indexName, _id: product._id.toString() } },
            {
                name: product.name,
                nameNoAccent: removeVietnameseTones(product.name),
                description: product.description || '',
                price: product.price,
                discountedPrice: product.discountedPrice || product.price,
                discountPercentage: product.discountPercentage || 0,
                stock: product.stock,
                images: product.images || [],
                category: product.category ? {
                    _id: product.category._id.toString(),
                    name: product.category.name,
                    nameNoAccent: removeVietnameseTones(product.category.name)
                } : null,
                brand: product.brand ? {
                    _id: product.brand._id.toString(),
                    name: product.brand.name,
                    nameNoAccent: removeVietnameseTones(product.brand.name)
                } : null,
                soldCount: product.soldCount || 0,
                viewCount: product.viewCount || 0,
                averageRating: product.averageRating || 0,
                reviewCount: product.reviewCount || 0,
                isActive: product.isActive !== undefined ? product.isActive : true,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }
        ]);

        const result = await client.bulk({ body, refresh: true });
        const resultBody = result.body || result;

        if (resultBody.errors) {
            console.error('❌ Có lỗi khi bulk index');
        } else {
            console.log(`✅ Đã sync ${products.length} sản phẩm thành công!`);
        }

        // Test search
        console.log('\n--- Test search "quan" (không dấu) ---');
        const testResult = await client.search({
            index: indexName,
            body: {
                query: {
                    bool: {
                        should: [
                            { match: { nameNoAccent: 'quan' } },
                            { match: { 'category.nameNoAccent': 'quan' } }
                        ]
                    }
                },
                size: 3
            }
        });
        const testBody = testResult.body || testResult;
        testBody.hits.hits.forEach((hit, i) => {
            console.log(`${i + 1}. ${hit._source.name} | Category: ${hit._source.category?.name}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resync();
