const jwt = require('jsonwebtoken');
require("dotenv").config();

const JWT_KEY = process.env.JWT_KEY;
if (!JWT_KEY) {
    throw new Error('JWT_KEY environment variable is required');
}

const User = require('../models/user.model');
const FoodPartner = require('../models/foodPartner.model');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "access denied - no token" });
    }
    try {
        const decoded = jwt.verify(token, JWT_KEY);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "invalid or expired session" });
    }
};


async function authFoodPartnerMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "access denied - no token" });
    }
    try {
        const decoded = jwt.verify(token, JWT_KEY);
        const foodPartner = await FoodPartner.findById(decoded.id).select("-password");

        if (!foodPartner) {
            return res.status(401).json({ message: "Food partner not found" });
        }

        req.foodPartner = foodPartner;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "invalid or expired session" });
    }
};

module.exports = { authMiddleware, authFoodPartnerMiddleware };