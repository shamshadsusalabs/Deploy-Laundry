const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Inventory = require('../models/Inventory');
const { createNotification } = require('./notificationController');

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Cashier, Admin, Manager)
exports.createOrder = async (req, res, next) => {
    try {
        const {
            customer: customerId,
            items,
            specialInstructions,
            deliveryDate,
            taxPercent = 0,
            discountPercent = 0,
            serviceCharge = 0,
        } = req.body;

        // Verify customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = (subtotal * taxPercent) / 100;
        const discountAmount = (subtotal * discountPercent) / 100;
        const totalAmount = subtotal + taxAmount - discountAmount + serviceCharge;

        const order = await Order.create({
            customer: customerId,
            items,
            specialInstructions,
            deliveryDate,
            subtotal,
            taxPercent,
            taxAmount,
            discountPercent,
            discountAmount,
            serviceCharge,
            totalAmount,
            createdBy: req.user._id,
        });

        // Auto-create invoice
        await Invoice.create({
            order: order._id,
            customer: customerId,
            subtotal,
            taxAmount,
            discountAmount,
            serviceCharge,
            totalAmount,
            createdBy: req.user._id,
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('customer', 'customerId name phone customerType')
            .populate('createdBy', 'name');

        // Notify admins/managers
        createNotification({
            recipientRoles: ['admin', 'manager'],
            type: 'order-created',
            title: 'New Order Created',
            message: `Order ${order.orderId} created for ${customer.name} — Total: ${totalAmount}`,
            relatedOrder: order._id,
            relatedCustomer: customerId,
        });

        res.status(201).json({ success: true, data: populatedOrder });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
    try {
        const { search, status, startDate, endDate, customer, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
            ];
        }
        if (status) filter.status = status;
        if (customer) filter.customer = customer;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('customer', 'customerId name phone customerType')
            .populate('assignedStaff', 'name')
            .populate('createdBy', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer')
            .populate('assignedStaff', 'name')
            .populate('createdBy', 'name')
            .populate('statusHistory.updatedBy', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Get associated invoice
        const invoice = await Invoice.findOne({ order: order._id });

        res.status(200).json({ success: true, data: { ...order.toObject(), invoice } });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, note, inventoryUsage } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Process inventory deduction if items are provided
        const processedUsage = [];
        if (inventoryUsage && inventoryUsage.length > 0) {
            for (const usage of inventoryUsage) {
                const item = await Inventory.findById(usage.item);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: `Inventory item not found: ${usage.itemName || usage.item}`,
                    });
                }
                if (item.quantity < usage.quantityUsed) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${item.itemName}". Available: ${item.quantity} ${item.unit}, Requested: ${usage.quantityUsed}`,
                    });
                }

                item.quantity -= usage.quantityUsed;
                await item.save();

                processedUsage.push({
                    item: item._id,
                    itemName: item.itemName,
                    quantityUsed: usage.quantityUsed,
                    unit: item.unit,
                });
            }
        }

        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user._id,
            note,
            inventoryUsage: processedUsage,
        });

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('customer', 'customerId name phone')
            .populate('statusHistory.updatedBy', 'name');

        // Notify on all status changes
        const statusTitles = {
            washing: 'Order In Washing',
            packed: 'Order Packed & Ready',
            delivered: 'Order Delivered',
            cancelled: 'Order Cancelled',
        };
        if (statusTitles[status]) {
            createNotification({
                recipientRoles: ['admin', 'manager', 'cashier'],
                type: `order-status-update`,
                title: statusTitles[status],
                message: `Order ${order.orderId} is now ${status}`,
                relatedOrder: order._id,
            });
        }

        res.status(200).json({ success: true, data: populatedOrder });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if invoice is finalized
        const invoice = await Invoice.findOne({ order: order._id });
        if (invoice && invoice.isFinalized && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit order after invoice is finalized. Admin override required.',
            });
        }

        const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        }).populate('customer', 'customerId name phone');

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private
exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = 'cancelled';
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            updatedBy: req.user._id,
            note: req.body.reason || 'Order cancelled',
        });
        await order.save();

        res.status(200).json({ success: true, message: 'Order cancelled', data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard stats
// @route   GET /api/orders/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalOrders, todayOrders, pendingOrders, completedOrders] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Order.countDocuments({ status: { $nin: ['delivered', 'cancelled'] } }),
            Order.countDocuments({ status: 'delivered' }),
        ]);

        // Today's revenue
        const todayRevenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Total revenue
        const totalRevenueAgg = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        const totalCustomers = await Customer.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                todayOrders,
                pendingOrders,
                completedOrders,
                todayRevenue: todayRevenueAgg[0]?.total || 0,
                totalRevenue: totalRevenueAgg[0]?.total || 0,
                totalCustomers,
            },
        });
    } catch (error) {
        next(error);
    }
};
