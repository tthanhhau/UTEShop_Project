import { Router } from 'express';
import multer from 'multer';
import { tryOnProxy } from '../controllers/VirtualTryOnController.js';

const router = Router();

// Cấu hình multer để nhận 2 file ảnh
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

const cpUpload = upload.fields([
    { name: 'person_image', maxCount: 1 },
    { name: 'cloth_image', maxCount: 1 }
]);

// Route: POST /api/try-on
router.post('/', cpUpload, tryOnProxy);

export default router;
