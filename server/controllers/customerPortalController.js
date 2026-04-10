const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');
const Service = require('../models/Service');
const Settings = require('../models/Settings');
const { createNotification } = require('./notificationController');

// @desc    Get customer's orders
// @route   GET /api/customer-portal/orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = { customer: req.customer._id };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .select('orderId status totalAmount items createdAt deliveryDate')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order detail
// @route   GET /api/customer-portal/orders/:id
// @access  Private (Customer)
exports.getMyOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            customer: req.customer._id,
        })
            .populate('statusHistory.updatedBy', 'name')
            .populate('assignedStaff', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Get associated invoice
        const invoice = await Invoice.findOne({ order: order._id });

        // Get deliveries
        const deliveries = await Delivery.find({ order: order._id })
            .select('deliveryId type status scheduledDate scheduledTime completedAt')
            .sort('-scheduledDate');

        res.status(200).json({
            success: true,
            data: { ...order.toObject(), invoice, deliveries },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer's invoices
// @route   GET /api/customer-portal/invoices
// @access  Private (Customer)
exports.getMyInvoices = async (req, res, next) => {
    try {
        const { paymentStatus, page = 1, limit = 20 } = req.query;
        const filter = { customer: req.customer._id };
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .populate('order', 'orderId status')
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

// @desc    Get single invoice detail
// @route   GET /api/customer-portal/invoices/:id
// @access  Private (Customer)
exports.getMyInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            customer: req.customer._id,
        }).populate({
            path: 'order',
            select: 'orderId status items totalAmount',
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const payments = await Payment.find({ invoice: invoice._id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: { ...invoice.toObject(), payments },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer dashboard summary
// @route   GET /api/customer-portal/summary
// @access  Private (Customer)
exports.getSummary = async (req, res, next) => {
    try {
        const customerId = req.customer._id;

        const [totalOrders, activeOrders, completedOrders, totalInvoices] = await Promise.all([
            Order.countDocuments({ customer: customerId }),
            Order.countDocuments({
                customer: customerId,
                status: { $nin: ['delivered', 'cancelled'] },
            }),
            Order.countDocuments({ customer: customerId, status: 'delivered' }),
            Invoice.countDocuments({ customer: customerId }),
        ]);

        // Unpaid balance
        const unpaidAgg = await Invoice.aggregate([
            { $match: { customer: customerId, paymentStatus: { $ne: 'paid' } } },
            { $group: { _id: null, total: { $sum: '$balanceDue' } } },
        ]);

        // Recent orders
        const recentOrders = await Order.find({ customer: customerId })
            .select('orderId status totalAmount createdAt')
            .sort('-createdAt')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                activeOrders,
                completedOrders,
                totalInvoices,
                unpaidBalance: unpaidAgg[0]?.total || 0,
                recentOrders,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available services for ordering
// @route   GET /api/customer-portal/services
// @access  Private (Customer)
exports.getServices = async (req, res, next) => {
    try {
        const services = await Service.find({ isActive: true }).sort('serviceType name');
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        next(error);
    }
};

// @desc    Customer creates an order
// @route   POST /api/customer-portal/orders
// @access  Private (Customer)
exports.createMyOrder = async (req, res, next) => {
    try {
        const { items, specialInstructions } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        // Validate and build order items
        const orderItems = [];
        for (const item of items) {
            const service = await Service.findById(item.serviceId);
            if (!service) {
                return res.status(404).json({ success: false, message: `Service not found: ${item.serviceId}` });
            }
            const quantity = Number(item.quantity) || 1;
            const subtotal = service.pricePerUnit * quantity;
            orderItems.push({
                service: service._id,
                serviceName: service.name,
                serviceType: service.serviceType,
                quantity,
                unit: service.unit,
                pricePerUnit: service.pricePerUnit,
                subtotal,
            });
        }

        // Get tax from settings
        const settings = await Settings.findOne();
        const taxPercent = settings?.taxPercent || 0;

        const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
        const taxAmount = (subtotal * taxPercent) / 100;
        const totalAmount = subtotal + taxAmount;

        const order = await Order.create({
            customer: req.customer._id,
            items: orderItems,
            specialInstructions,
            subtotal,
            taxPercent,
            taxAmount,
            totalAmount,
        });

        // Auto-create invoice
        await Invoice.create({
            order: order._id,
            customer: req.customer._id,
            subtotal,
            taxAmount,
            totalAmount,
        });

        // Notify admins
        createNotification({
            recipientRoles: ['admin', 'manager'],
            type: 'order-created',
            title: 'New Customer Order',
            message: `Order ${order.orderId} placed by ${req.customer.name} — Total: ${totalAmount}`,
            relatedOrder: order._id,
            relatedCustomer: req.customer._id,
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('customer', 'customerId name phone');

        res.status(201).json({ success: true, data: populatedOrder });
    } catch (error) {
        next(error);
    }
};
