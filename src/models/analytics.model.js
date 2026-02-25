const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    metrics: {
        totalOrders: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        totalViews: {
            type: Number,
            default: 0
        },
        totalLikes: {
            type: Number,
            default: 0
        },
        totalShares: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for efficient querying by partner and date
analyticsSchema.index({ foodPartner: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);













