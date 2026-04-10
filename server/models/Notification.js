const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'order-created',
                'order-status-update',
                'order-ready',
                'order-delivered',
                'payment-received',
                'low-stock',
                'new-customer',
                'system',
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
