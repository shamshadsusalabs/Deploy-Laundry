const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

const InvoiceCounter = mongoose.model('InvoiceCounter', invoiceCounterSchema);

const invoiceSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: String,
            unique: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        serviceCharge: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        balanceDue: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'partial', 'paid'],
            default: 'unpaid',
        },
        isFinalized: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Auto-generate Invoice ID (INV-0001, INV-0002, ...)
invoiceSchema.pre('save', async function () {
    if (this.isNew) {
        const counter = await InvoiceCounter.findByIdAndUpdate(
            'invoiceId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.invoiceId = `INV-${String(counter.seq).padStart(4, '0')}`;
        this.balanceDue = this.totalAmount - this.paidAmount;
    }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
