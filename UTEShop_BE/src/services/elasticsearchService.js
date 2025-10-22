import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

class ElasticsearchService {
    constructor() {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        });
        this.indexName = process.env.ELASTICSEARCH_INDEX_PRODUCTS || 'uteshop_products2';
    }

    // Kiểm tra kết nối
    async checkConnection() {
        try {
            const health = await this.client.cluster.health();
            console.log('✅ Elasticsearch connected:', health.status);
            return true;
        } catch (error) {
            console.error('❌ Elasticsearch connection failed:', error.message);
            return false;
        }
    }

    // Tạo index với mapping
    async createIndex() {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });

            if (exists) {
                console.log(`📦 Index ${this.indexName} đã tồn tại`);
                return;
            }

            await this.client.indices.create({
                index: this.indexName,
                body: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        analysis: {
                            filter: {
                                vn_ascii_folding: { type: 'asciifolding', preserve_original: false }
                            },
                            analyzer: {
                                vietnamese_analyzer: {
                                    type: 'standard',
                                    stopwords: '_vietnamese_'
                                },
                                vn_text: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'vn_ascii_folding']
                                },
                                vn_text_search: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'vn_ascii_folding']
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            name: {
                                type: 'text',
                                analyzer: 'vn_text',
                                search_analyzer: 'vn_text_search',
                                fields: {
                                    keyword: { type: 'keyword' },
                                    suggest: { type: 'completion' }
                                }
                            },
                            description: {
                                type: 'text',
                                analyzer: 'vn_text',
                                search_analyzer: 'vn_text_search'
                            },
                            price: { type: 'float' },
                            discountedPrice: { type: 'float' },
                            discountPercentage: { type: 'integer' },
                            stock: { type: 'integer' },
                            images: { type: 'keyword' },
                            category: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'keyword' },
                                    name: {
                                        type: 'text',
                                        analyzer: 'vn_text',
                                        search_analyzer: 'vn_text_search',
                                        fields: { keyword: { type: 'keyword' } }
                                    }
                                }
                            },
                            brand: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'keyword' },
                                    name: {
                                        type: 'text',
                                        analyzer: 'vn_text',
                                        search_analyzer: 'vn_text_search',
                                        fields: { keyword: { type: 'keyword' } }
                                    }
                                }
                            },
                            soldCount: { type: 'integer' },
                            viewCount: { type: 'integer' },
                            averageRating: { type: 'float' },
                            reviewCount: { type: 'integer' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' }
                        }
                    }
                }
            });

            console.log(`✅ Đã tạo index ${this.indexName}`);
        } catch (error) {
            console.error('❌ Lỗi tạo index:', error.message);
            throw error;
        }
    }

    // Index một sản phẩm
    async indexProduct(product) {
        try {
            const body = {
                name: product.name,
                description: product.description || '',
                price: product.price,
                discountedPrice: product.discountedPrice || product.price,
                discountPercentage: product.discountPercentage || 0,
                stock: product.stock,
                images: product.images || [],
                category: product.category ? {
                    _id: product.category._id.toString(),
                    name: product.category.name
                } : null,
                brand: product.brand ? {
                    _id: product.brand._id.toString(),
                    name: product.brand.name
                } : null,
                soldCount: product.soldCount || 0,
                viewCount: product.viewCount || 0,
                averageRating: product.averageRating || 0,
                reviewCount: product.reviewCount || 0,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };

            await this.client.index({
                index: this.indexName,
                id: product._id.toString(),
                body,
                refresh: true
            });

            return true;
        } catch (error) {
            console.error('❌ Lỗi index sản phẩm:', error.message);
            return false;
        }
    }

    // Bulk index nhiều sản phẩm
    async bulkIndexProducts(products) {
        try {
            const body = products.flatMap(product => [
                { index: { _index: this.indexName, _id: product._id.toString() } },
                {
                    name: product.name,
                    description: product.description || '',
                    price: product.price,
                    discountedPrice: product.discountedPrice || product.price,
                    discountPercentage: product.discountPercentage || 0,
                    stock: product.stock,
                    images: product.images || [],
                    category: product.category ? {
                        _id: product.category._id.toString(),
                        name: product.category.name
                    } : null,
                    brand: product.brand ? {
                        _id: product.brand._id.toString(),
                        name: product.brand.name
                    } : null,
                    soldCount: product.soldCount || 0,
                    viewCount: product.viewCount || 0,
                    averageRating: product.averageRating || 0,
                    reviewCount: product.reviewCount || 0,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                }
            ]);

            const result = await this.client.bulk({ body, refresh: true });

            if (result.errors) {
                const erroredDocuments = [];
                result.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: body[i * 2],
                            document: body[i * 2 + 1]
                        });
                    }
                });
                console.error('❌ Có lỗi khi bulk index:', erroredDocuments.length);
            }

            return result;
        } catch (error) {
            console.error('❌ Lỗi bulk index:', error.message);
            throw error;
        }
    }

    // Xóa sản phẩm
    async deleteProduct(productId) {
        try {
            await this.client.delete({
                index: this.indexName,
                id: productId.toString(),
                refresh: true
            });
            return true;
        } catch (error) {
            if (error.meta?.statusCode === 404) {
                return true; // Product not found in ES, consider it deleted
            }
            console.error('❌ Lỗi xóa sản phẩm:', error.message);
            return false;
        }
    }

    // Tìm kiếm sản phẩm
    async searchProducts({
        query = '',
        category = '',
        brand = '',
        minPrice = 0,
        maxPrice = 999999999,
        page = 1,
        limit = 12,
        sort = 'relevance'
    }) {
        try {
            const from = (page - 1) * limit;

            // Build query
            const must = [];
            const filter = [];

            // Full-text search với fuzzy matching
            if (query) {
                must.push({
                    multi_match: {
                        query,
                        fields: ['name^5'],
                        type: 'best_fields',
                        fuzziness: 'AUTO',
                        operator: 'or'
                    }
                });
            } else {
                must.push({ match_all: {} });
            }

            // Filter by category
            if (category) {
                filter.push({
                    term: { 'category.name.keyword': category }
                });
            }

            // Filter by brand
            if (brand) {
                filter.push({
                    term: { 'brand.name.keyword': brand }
                });
            }

            // Filter by price range
            filter.push({
                range: {
                    discountedPrice: {
                        gte: minPrice,
                        lte: maxPrice
                    }
                }
            });

            // Build sort
            let sortOption;
            switch (sort) {
                case 'price-asc':
                    sortOption = [{ discountedPrice: 'asc' }];
                    break;
                case 'price-desc':
                    sortOption = [{ discountedPrice: 'desc' }];
                    break;
                case 'newest':
                    sortOption = [{ createdAt: 'desc' }];
                    break;
                case 'best-selling':
                    sortOption = [{ soldCount: 'desc' }];
                    break;
                case 'top-rated':
                    sortOption = [{ averageRating: 'desc' }];
                    break;
                default:
                    sortOption = [{ _score: 'desc' }];
            }

            // Execute search
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    from,
                    size: limit,
                    query: {
                        bool: { must, filter }
                    },
                    sort: sortOption,
                    // Aggregations for facets
                    aggs: {
                        categories: {
                            terms: { field: 'category.name.keyword', size: 50 }
                        },
                        brands: {
                            terms: { field: 'brand.name.keyword', size: 50 }
                        },
                        price_ranges: {
                            range: {
                                field: 'discountedPrice',
                                ranges: [
                                    { key: 'under-500k', to: 500000 },
                                    { key: '500k-1m', from: 500000, to: 1000000 },
                                    { key: '1m-2m', from: 1000000, to: 2000000 },
                                    { key: '2m-5m', from: 2000000, to: 5000000 },
                                    { key: 'over-5m', from: 5000000 }
                                ]
                            }
                        },
                        price_stats: {
                            stats: { field: 'discountedPrice' }
                        }
                    }
                }
            });

            return {
                products: result.hits.hits.map(hit => ({
                    _id: hit._id,
                    ...hit._source,
                    _score: hit._score
                })),
                total: result.hits.total.value,
                page,
                limit,
                totalPages: Math.ceil(result.hits.total.value / limit),
                facets: {
                    categories: result.aggregations.categories.buckets,
                    brands: result.aggregations.brands.buckets,
                    priceRanges: result.aggregations.price_ranges.buckets,
                    priceStats: result.aggregations.price_stats
                }
            };
        } catch (error) {
            console.error('❌ Lỗi tìm kiếm:', error.message);
            throw error;
        }
    }

    // Gợi ý tìm kiếm (autocomplete)
    async suggest(query, limit = 5) {
        try {
            const result = await this.client.search({
                index: this.indexName,
                body: {
                    suggest: {
                        name_suggest: {
                            prefix: query,
                            completion: {
                                field: 'name.suggest',
                                fuzzy: { fuzziness: 1 }
                            }
                        }
                    },
                    _source: ['name', 'price', 'discountedPrice', 'images'],
                    size: 0
                }
            });

            const options = result.suggest?.name_suggest?.[0]?.options || [];
            return options.slice(0, limit).map(opt => ({
                _id: opt._id,
                ...opt._source
            }));
        } catch (error) {
            console.error('❌ Lỗi gợi ý:', error.message);
            return [];
        }
    }

    // Xóa index
    async deleteIndex() {
        try {
            await this.client.indices.delete({ index: this.indexName });
            console.log(`✅ Đã xóa index ${this.indexName}`);
        } catch (error) {
            console.error('❌ Lỗi xóa index:', error.message);
        }
    }
}

export default new ElasticsearchService();

