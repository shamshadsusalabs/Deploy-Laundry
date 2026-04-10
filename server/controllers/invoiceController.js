const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
    try {
        const { paymentStatus, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .populate('order', 'orderId status')
            .populate('customer', 'customerId name phone customerType')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: invoices.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            data: invoices,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single invoice with payments + business details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: 'order',
                populate: [
                    { path: 'customer' },
                    { path: 'items' },
                ],
            })
            .populate('customer');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const payments = await Payment.find({ invoice: invoice._id })
            .populate('processedBy', 'name')
            .sort('-createdAt');

        // Fetch business settings for invoice display
        let settings = await Settings.findById('global');
        if (!settings) {
            settings = await Settings.create({ _id: 'global' });
        }

        res.status(200).json({
            success: true,
            data: {
                ...invoice.toObject(),
                payments,
                business: {
                    name: settings.businessName,
                    phone: settings.businessPhone,
                    email: settings.businessEmail,
                    address: settings.businessAddress,
                    taxNumberLabel: settings.taxNumberLabel,
                    taxNumber: settings.taxNumber,
                    currency: settings.currency,
                    taxRate: settings.taxRate,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
