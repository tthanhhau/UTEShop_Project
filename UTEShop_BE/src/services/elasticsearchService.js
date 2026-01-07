// elasticsearchService.js
// Sử dụng OpenSearch client vì Bonsai dùng OpenSearch, không phải Elasticsearch
import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

// Helper function để chuyển tiếng Việt có dấu thành không dấu
function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

// Simple in-memory cache với TTL
class SimpleCache {
    constructor(ttlMs = 30000) { // Default 30 giây
        this.cache = new Map();
        this.ttl = ttlMs;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl
        });
    }

    clear() {
        this.cache.clear();
    }
}

// Cache cho search results (30s) và suggestions (60s)
const searchCache = new SimpleCache(30000);
const suggestCache = new SimpleCache(60000);

class ElasticsearchService {
    constructor() {
        const esUrl = process.env.ELASTICSEARCH_URL || process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

        this.client = new Client({
            node: esUrl,
            ssl: { rejectUnauthorized: false }
        });

        this.indexName = process.env.ELASTICSEARCH_INDEX_PRODUCTS || 'uteshop_products';
        console.log('📦 OpenSearch connecting to:', esUrl.replace(/\/\/.*:.*@/, '//***:***@'));
    }

    async checkConnection() {
        try {
            const response = await this.client.cluster.health();
            const health = response.body || response;
            console.log('✅ OpenSearch connected:', health.status);
            return true;
        } catch (error) {
            console.error('❌ OpenSearch connection failed:', error.message);
            return false;
        }
    }

    async createIndex() {
        try {
            const existsResponse = await this.client.indices.exists({ index: this.indexName });
            const exists = existsResponse.body !== undefined ? existsResponse.body : existsResponse;

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
                                vn_ascii_folding: { type: 'asciifolding', preserve_original: true }
                            },
                            analyzer: {
                                vn_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'vn_ascii_folding']
                                }
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
            console.log(`✅ Đã tạo index ${this.indexName}`);
        } catch (error) {
            console.error('❌ Lỗi tạo index:', error.message);
            throw error;
        }
    }


    async indexProduct(product) {
        try {
            const body = {
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

    async bulkIndexProducts(products) {
        try {
            const body = products.flatMap(product => [
                { index: { _index: this.indexName, _id: product._id.toString() } },
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

            const result = await this.client.bulk({ body, refresh: true });
            const resultBody = result.body || result;

            if (resultBody.errors) {
                console.error('❌ Có lỗi khi bulk index');
            }
            return resultBody;
        } catch (error) {
            console.error('❌ Lỗi bulk index:', error.message);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await this.client.delete({
                index: this.indexName,
                id: productId.toString(),
                refresh: true
            });
            return true;
        } catch (error) {
            if (error.meta?.statusCode === 404) return true;
            console.error('❌ Lỗi xóa sản phẩm:', error.message);
            return false;
        }
    }


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
            // Tạo cache key từ params
            const cacheKey = `search:${query}:${category}:${brand}:${minPrice}:${maxPrice}:${page}:${limit}:${sort}`;
            const cached = searchCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            const from = (page - 1) * limit;
            const must = [];
            const filter = [];

            if (query) {
                const queryNoAccent = removeVietnameseTones(query);
                // Tối ưu: Bỏ wildcard queries (rất chậm), dùng multi_match + prefix thay thế
                must.push({
                    bool: {
                        should: [
                            // Multi-match cho search nhanh hơn
                            {
                                multi_match: {
                                    query: query,
                                    fields: ['name^3', 'category.name^2', 'brand.name^2'],
                                    type: 'best_fields',
                                    fuzziness: 'AUTO',
                                    prefix_length: 1
                                }
                            },
                            // Search không dấu
                            {
                                multi_match: {
                                    query: queryNoAccent,
                                    fields: ['nameNoAccent^2.5', 'category.nameNoAccent^1.5', 'brand.nameNoAccent^1.5'],
                                    type: 'best_fields',
                                    fuzziness: 'AUTO',
                                    prefix_length: 1
                                }
                            },
                            // Prefix match cho autocomplete-style search (nhanh hơn wildcard)
                            { prefix: { 'name.keyword': { value: query.toLowerCase(), boost: 2 } } },
                            { match_phrase_prefix: { name: { query: query, boost: 1.5 } } },
                            { match_phrase_prefix: { nameNoAccent: { query: queryNoAccent, boost: 1 } } }
                        ],
                        minimum_should_match: 1
                    }
                });
            } else {
                must.push({ match_all: {} });
            }

            // Filters
            if (category) {
                filter.push({ term: { 'category._id': category } });
            }
            if (brand) {
                filter.push({ term: { 'brand._id': brand } });
            }
            filter.push({ range: { discountedPrice: { gte: minPrice, lte: maxPrice } } });
            filter.push({ term: { isActive: true } });

            // Sort - khi có query và sort là newest, vẫn ưu tiên relevance trước
            let sortOption;
            if (query && sort === 'newest') {
                sortOption = [{ _score: 'desc' }, { createdAt: 'desc' }];
            } else {
                switch (sort) {
                    case 'price-asc': sortOption = [{ discountedPrice: 'asc' }]; break;
                    case 'price-desc': sortOption = [{ discountedPrice: 'desc' }]; break;
                    case 'newest': sortOption = [{ createdAt: 'desc' }]; break;
                    case 'best-selling': sortOption = [{ soldCount: 'desc' }]; break;
                    case 'top-rated': sortOption = [{ averageRating: 'desc' }]; break;
                    default: sortOption = [{ _score: 'desc' }];
                }
            }

            const result = await this.client.search({
                index: this.indexName,
                body: {
                    from,
                    size: limit,
                    query: { bool: { must, filter } },
                    sort: sortOption,
                    aggs: {
                        categories: { terms: { field: 'category.name.keyword', size: 50 } },
                        brands: { terms: { field: 'brand.name.keyword', size: 50 } },
                        price_stats: { stats: { field: 'discountedPrice' } }
                    }
                }
            });

            const body = result.body || result;
            const total = typeof body.hits.total === 'number' ? body.hits.total : body.hits.total.value;

            const searchResult = {
                products: body.hits.hits.map(hit => ({
                    _id: hit._id,
                    ...hit._source,
                    _score: hit._score
                })),
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                facets: {
                    categories: body.aggregations?.categories?.buckets || [],
                    brands: body.aggregations?.brands?.buckets || [],
                    priceStats: body.aggregations?.price_stats || {}
                }
            };

            // Cache kết quả
            searchCache.set(cacheKey, searchResult);

            return searchResult;
        } catch (error) {
            console.error('❌ Lỗi tìm kiếm:', error.message);
            throw error;
        }
    }


    async suggest(query, limit = 10) {
        try {
            if (!query || query.length < 1) return [];

            // Check cache
            const cacheKey = `suggest:${query}:${limit}`;
            const cached = suggestCache.get(cacheKey);
            if (cached) {
                return cached;
            }

            const queryNoAccent = removeVietnameseTones(query);

            const result = await this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        bool: {
                            should: [
                                // Dùng match_phrase_prefix thay vì wildcard - nhanh hơn nhiều
                                { match_phrase_prefix: { name: { query: query, boost: 3 } } },
                                { match_phrase_prefix: { nameNoAccent: { query: queryNoAccent, boost: 2.5 } } },
                                // Multi-match với fuzziness cho typo tolerance
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ['name^3', 'category.name^1.5'],
                                        type: 'best_fields',
                                        fuzziness: 'AUTO',
                                        prefix_length: 1
                                    }
                                },
                                {
                                    multi_match: {
                                        query: queryNoAccent,
                                        fields: ['nameNoAccent^2', 'category.nameNoAccent^1'],
                                        type: 'best_fields',
                                        fuzziness: 'AUTO',
                                        prefix_length: 1
                                    }
                                }
                            ],
                            minimum_should_match: 1,
                            filter: [{ term: { isActive: true } }]
                        }
                    },
                    _source: ['name', 'price', 'discountedPrice', 'images', 'category', 'brand'],
                    size: limit,
                    sort: [{ _score: 'desc' }, { soldCount: 'desc' }]
                }
            });

            const body = result.body || result;
            const suggestions = body.hits.hits.map(hit => ({
                _id: hit._id,
                ...hit._source,
                _score: hit._score
            }));

            // Cache kết quả
            suggestCache.set(cacheKey, suggestions);

            return suggestions;
        } catch (error) {
            console.error('❌ Lỗi gợi ý:', error.message);
            return [];
        }
    }

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
