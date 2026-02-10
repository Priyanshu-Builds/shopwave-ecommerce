const express = require('express');
const {
    createOrder,
    getMyOrders,
    getOrder,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');
const { orderValidator } = require('../middleware/validators');

const router = express.Router();

// All order routes are protected
router.use(protect);

// User routes
router.post('/', orderValidator, createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrder);

// Admin routes
router.get('/', admin, getAllOrders);
router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;
