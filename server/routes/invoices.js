const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice } = require('../controllers/invoiceController');
const {
    getMigratedInvoices,
    getMigratedInvoice,
    importMigratedInvoices,
    clearMigratedInvoices
} = require('../controllers/migratedInvoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Migrated invoice routes (must be registered BEFORE standard :id)
router.route('/migrated').get(getMigratedInvoices).delete(clearMigratedInvoices);
router.route('/migrated/import').post(importMigratedInvoices);
router.route('/migrated/:id').get(getMigratedInvoice);

router.route('/').get(getInvoices);
router.route('/:id').get(getInvoice);

module.exports = router;
