import { Router } from 'express';
import multer from 'multer';
import {
    searchByImage,
    updateEmbeddings,
    healthCheck
} from '../controllers/ImageSearchController.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
        }
    }
});

// Health check
router.get('/health', healthCheck);

// Search by image
// Supports both file upload and base64 JSON
router.post('/search', upload.single('image'), searchByImage);

// Update embeddings (admin only - can add auth middleware later)
router.post('/update-embeddings', updateEmbeddings);

export default router;

