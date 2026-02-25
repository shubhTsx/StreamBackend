const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const FoodPartner = require('../models/foodPartner.model');
require('dotenv').config();

const JWT_KEY = process.env.JWT_KEY || 'fallback_jwt_secret_key_for_development';

async function testJWT() {
    try {
        console.log('Testing JWT setup...');
        console.log('JWT_KEY exists:', !!JWT_KEY);
        console.log('JWT_KEY length:', JWT_KEY.length);

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zomato');
        console.log('Connected to database');

        // Find a food partner
        const foodPartner = await FoodPartner.findOne({});
        if (!foodPartner) {
            console.log('No food partner found in database');
            return;
        }

        console.log('Found food partner:', foodPartner.name);

        // Generate token
        const token = jwt.sign({ id: foodPartner._id }, JWT_KEY);
        console.log('Generated token:', token.substring(0, 20) + '...');

        // Verify token
        const decoded = jwt.verify(token, JWT_KEY);
        console.log('Decoded token:', decoded);

        // Find food partner by decoded ID
        const foundPartner = await FoodPartner.findById(decoded.id);
        console.log('Found partner by token:', !!foundPartner);

        console.log('JWT test completed successfully!');

    } catch (error) {
        console.error('JWT test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testJWT();








