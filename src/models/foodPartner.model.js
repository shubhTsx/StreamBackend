const mongoose = require('mongoose');

const foodPartherSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    contactName: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    email: {
        required: true,
        type: String
    },
    password: {
        type: String,
    },
    cart: {
        type: Array,
    },
    partnerToken: {
        type: String,
        unique: true,
        sparse: true
    },
    restaurant: {
        name: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        cuisine: {
            type: String,
            default: ''
        },
        location: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        isRegistered: {
            type: Boolean,
            default: false
        },
        registrationDate: {
            type: Date
        }
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('FoodPartner', foodPartherSchema);
