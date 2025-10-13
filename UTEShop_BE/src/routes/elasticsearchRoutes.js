import express from 'express';
import {
    searchProducts,
    suggestProducts,
    syncProduct,
    deleteProductFromES,
    getFacets,
    healthCheck
} from '../controllers/ElasticsearchController.js';

const router = express.Router();

// Public routes
router.get('/search', searchProducts);
router.get('/suggest', suggestProducts);
router.get('/facets', getFacets);
router.get('/health', healthCheck);

// Admin routes (nên thêm auth middleware sau)
router.post('/sync/:productId', syncProduct);
router.delete('/delete/:productId', deleteProductFromES);

export default router;

