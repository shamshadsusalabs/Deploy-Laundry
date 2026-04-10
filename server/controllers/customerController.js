const Customer = require('../models/Customer');
const Order = require('../models/Order');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
    try {
        const { search, customerType, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { customerId: { $regex: search, $options: 'i' } },
            ];
        }
        if (customerType) filter.customerType = customerType;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Customer.countDocuments(filter);
        const customers = await Customer.find(filter)
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: customers.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: customers,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer with order history
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Get order history
        const orders = await Order.find({ customer: req.params.id })
            .sort('-createdAt')
            .limit(20)
            .populate('createdBy', 'name');

        res.status(200).json({
            success: true,
            data: { ...customer.toObject(), orders },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address, customerType } = req.body;
        const customer = await Customer.create({ name, phone, email, address, customerType });
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address, customerType } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { name, phone, email, address, customerType },
            { returnDocument: 'after', runValidators: true }
        );
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        next(error);
    }
};
