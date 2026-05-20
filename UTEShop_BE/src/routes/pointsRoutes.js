import express from 'express';
import {
  getCustomerPointHistory,
  earnPointsFromOrder,
  redeemPoints,
  usePointsForOrder,
  getPointsConfig
} from '../controllers/PointsController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/config', getPointsConfig);

// Customer routes (require authentication)
router.use(protect);

router.get('/history', getCustomerPointHistory);
router.post('/earn', earnPointsFromOrder);
router.post('/redeem', redeemPoints);
router.post('/use-for-order', usePointsForOrder);

export default router;
