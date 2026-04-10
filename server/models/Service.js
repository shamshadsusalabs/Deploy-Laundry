const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
        },
        serviceType: {
            type: String,
            enum: ['wash-fold', 'dry-cleaning', 'ironing', 'express', 'bulk-commercial'],
            required: [true, 'Service type is required'],
        },
        description: {
            type: String,
            trim: true,
        },
        pricePerUnit: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        unit: {
            type: String,
            enum: ['piece', 'kg', 'bundle'],
            default: 'piece',
        },
        isExpress: {
            type: Boolean,
            default: false,
        },
        expressSurchargePercent: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
