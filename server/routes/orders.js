const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    getDashboardStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Stats route must come before /:id
router.get('/stats/dashboard', getDashboardStats);

router.route('/').get(getOrders).post(authorize('admin', 'manager', 'cashier'), createOrder);
router.route('/:id').get(getOrder).put(updateOrder).delete(cancelOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
