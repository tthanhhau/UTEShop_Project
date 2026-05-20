import express from 'express';
import {
  validateVoucher,
  applyVoucher
} from '../controllers/VoucherController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/validate', protect, validateVoucher);
router.post('/apply', protect, applyVoucher);

export default router;
