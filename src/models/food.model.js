const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const foodSchema = new mongoose.Schema({
    foodname: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: false,
    },
    image: {
        type: String,
    },
    thumbnail: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        default: 0
    },
    ingredients: {
        type: String,
    },
    category: {
        type: String,
        default: 'Food'
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [commentSchema],
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner",
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isReel: {
        type: Boolean,
        default: false
    },
    reelData: {
        duration: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        hashtags: [{
            type: String
        }],
        location: {
            type: String
        }
    }
}, {
    timestamps: true
});

const food = mongoose.model('Food', foodSchema);
module.exports = food;