import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// User routes
// Create a new order (requires authentication)
router.post('/', requireAuth, OrderController.createOrder);

// Get user's orders (requires authentication)
router.get('/', requireAuth, OrderController.getUserOrders);

// Get order details (requires authentication)
router.get('/:orderId', requireAuth, OrderController.getOrderById);

// Cancel an order (requires authentication)
router.delete('/:orderId', requireAuth, OrderController.cancelOrder);
router.put('/:orderId', requireAuth, OrderController.cancelOrder);

// Handle delivery confirmation (requires authentication)
router.post('/:orderId/delivery-confirmation', requireAuth, OrderController.handleDeliveryConfirmation);

export default router;
