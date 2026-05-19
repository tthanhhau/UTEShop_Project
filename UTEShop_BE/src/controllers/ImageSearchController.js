import axios from 'axios';
import FormData from 'form-data';
import http from 'http';
import asyncHandler from '../middlewares/asyncHandler.js';

// Force IPv4 to avoid ECONNREFUSED ::1 error on Windows
const IMAGE_SEARCH_SERVICE_URL = (process.env.IMAGE_SEARCH_SERVICE_URL || 'http://127.0.0.1:5002')
    .replace('localhost', '127.0.0.1');

// Check if image search is enabled (Python service available)
const IMAGE_SEARCH_ENABLED = process.env.IMAGE_SEARCH_ENABLED === 'true' || process.env.NODE_ENV !== 'production';

// Create HTTP agent that forces IPv4
const httpAgent = new http.Agent({
    family: 4 // Force IPv4
});

/**
 * Search products by image
 * Accepts multipart/form-data with image file or JSON with base64 image
 */
export const searchByImage = asyncHandler(async (req, res) => {
    try {
        // Check if image search is disabled in production
        if (!IMAGE_SEARCH_ENABLED) {
            return res.status(503).json({
                success: false,
                message: 'Tính năng tìm kiếm bằng hình ảnh hiện không khả dụng trên production. Vui lòng thử trên môi trường local.',
                reason: 'AI Image Search requires Python service which is not deployed.',
                suggestion: 'Tính năng này cần GPU/resources cao, chỉ có trong môi trường development.'
            });
        }

        console.log('📸 Image search request received');
        console.log('Request file:', req.file ? 'exists' : 'missing');
        console.log('Request body keys:', Object.keys(req.body || {}));

        let imageData = null;
        let isBase64 = false;

        // Check if image is uploaded as file
        if (req.file && req.file.buffer) {
            console.log('📁 Processing file upload:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.buffer.length
            });
            imageData = req.file.buffer;
        }
        // Check if image is sent as base64 in body
        else if (req.body && req.body.image_base64) {
            console.log('📝 Processing base64 image');
            imageData = req.body.image_base64;
            isBase64 = true;
        }
        else {
            console.error('❌ No image provided in request');
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp hình ảnh để tìm kiếm'
            });
        }

        const topK = parseInt(req.query.top_k || req.body.top_k || 10);
        const textQuery = (req.body && req.body.text) || req.query.text || '';
        console.log(`🔍 Searching with top_k=${topK}, service URL: ${IMAGE_SEARCH_SERVICE_URL}`);

        // Forward request to Python image search service
        let response;

        if (isBase64) {
            // Send as JSON with base64
            console.log('📤 Sending base64 image to Python service...');
            response = await axios.post(
                `${IMAGE_SEARCH_SERVICE_URL}/search?top_k=${topK}`,
                { image_base64: imageData, ...(textQuery ? { text: textQuery } : {}) },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000, // 30 seconds timeout
                    httpAgent: httpAgent // Force IPv4
                }
            );
        } else {
            // Send as multipart form data
            console.log('📤 Sending file to Python service...');
            const formData = new FormData();
            formData.append('image', imageData, {
                filename: req.file.originalname || 'image.jpg',
                contentType: req.file.mimetype || 'image/jpeg'
            });
            if (textQuery) {
                formData.append('text', textQuery);
            }

            response = await axios.post(
                `${IMAGE_SEARCH_SERVICE_URL}/search?top_k=${topK}`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 30000,
                    httpAgent: httpAgent // Force IPv4
                }
            );
        }

        console.log('✅ Python service responded:', response.status);

        if (response.data.success) {
            return res.json({
                success: true,
                data: response.data.results,
                count: response.data.count
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm hình ảnh',
                error: response.data.error
            });
        }
    } catch (error) {
        console.error('❌ Image search error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.error('⚠️  Python service is not running or not accessible');
            return res.status(503).json({
                success: false,
                message: 'Dịch vụ tìm kiếm hình ảnh hiện không khả dụng. Vui lòng đảm bảo Python service đang chạy trên port 5002.',
                error: `Cannot connect to ${IMAGE_SEARCH_SERVICE_URL}`
            });
        }

        if (error.response) {
            // Python service returned an error
            return res.status(error.response.status || 500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm hình ảnh',
                error: error.response.data?.error || error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm hình ảnh',
            error: error.message
        });
    }
});

/**
 * Update embeddings for all products
 * This should be called after adding/updating products
 */
export const updateEmbeddings = asyncHandler(async (req, res) => {
    try {
        console.log('🔄 Calling Python service to update embeddings...');
        const response = await axios.post(
            `${IMAGE_SEARCH_SERVICE_URL}/update-embeddings`,
            {},
            {
                timeout: 300000, // 5 minutes timeout for large datasets
                httpAgent: httpAgent // Force IPv4
            }
        );

        console.log('✅ Embeddings updated successfully:', response.data);
        return res.json({
            success: true,
            message: response.data.message || 'Cập nhật embeddings thành công',
            count: response.data.count
        });
    } catch (error) {
        console.error('❌ Update embeddings error:', error.message);
        console.error('Error response:', error.response?.data);

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                message: 'Dịch vụ tìm kiếm hình ảnh hiện không khả dụng. Vui lòng đảm bảo Python service đang chạy trên port 5002.',
                error: `Cannot connect to ${IMAGE_SEARCH_SERVICE_URL}`
            });
        }

        if (error.response) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: 'Lỗi khi cập nhật embeddings',
                error: error.response.data?.error || error.message,
                details: error.response.data?.details,
                hint: error.response.data?.hint
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật embeddings',
            error: error.message
        });
    }
});

/**
 * Health check for image search service
 */
export const healthCheck = asyncHandler(async (req, res) => {
    try {
        const response = await axios.get(`${IMAGE_SEARCH_SERVICE_URL}/health`, {
            timeout: 5000,
            httpAgent: httpAgent // Force IPv4
        });

        return res.json({
            success: true,
            status: response.data.status,
            service: 'Image Search Service'
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            status: 'unavailable',
            service: 'Image Search Service',
            error: error.message
        });
    }
});

