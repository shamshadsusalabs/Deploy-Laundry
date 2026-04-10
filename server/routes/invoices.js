const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getInvoices);
router.route('/:id').get(getInvoice);

module.exports = router;
