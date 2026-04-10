const express = require('express');
const router = express.Router();
const {
    getMyOrders,
    getMyOrder,
    getMyInvoices,
    getMyInvoice,
    getSummary,
    getServices,
    createMyOrder,
} = require('../controllers/customerPortalController');
const { protectCustomer } = require('../middleware/customerAuth');

router.use(protectCustomer);

router.get('/summary', getSummary);
router.get('/services', getServices);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getMyOrder);
router.post('/orders', createMyOrder);
router.get('/invoices', getMyInvoices);
router.get('/invoices/:id', getMyInvoice);

module.exports = router;
