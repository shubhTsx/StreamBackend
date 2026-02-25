const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        utrCode: {
            type: String,
            required: true
        },
        screenshotUrl: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            default: 399
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodPartner'
        },
        rejectedReason: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
