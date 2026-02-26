const User = require('../models/user.model');
const FoodPartner = require('../models/foodPartner.model');
const bcrypt = require('bcrypt');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require("dotenv").config();

const JWT_KEY = process.env.JWT_KEY;
if (!JWT_KEY) {
    throw new Error('JWT_KEY environment variable is required');
}

const isProduction = process.env.NODE_ENV === 'production';

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'strict',
    };
}

// ====== user register ===========
async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;
        const isAlreadyExists = await User.findOne({ email });

        if (isAlreadyExists) {
            return res.status(400).json({ message: "User already exists. Please login instead." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        await user.save();
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (err) {
        res.status(500).json({ message: "Registration failed. Please try again." });
    }
}
//======================================================================

// ================= login user ========================

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found. Please register first." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, JWT_KEY);

        res.cookie("token", token, getCookieOptions());

        res.status(200).json({
            message: `Welcome back, ${user.name}!`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture || '',
                subscriptionStatus: user.subscriptionStatus || 'none',
            },
            token: token
        });
    }
    catch (err) {
        res.status(500).json({ message: "Login failed. Please try again." });
    }
}
//======================================================================

// =====================register foodpartner ====================
async function registerFoodPartner(req, res) {
    try {
        const { name, email, password, contactName, phone, address, adminCode } = req.body;

        // Validate admin code
        const validAdminCode = process.env.ADMIN_CODE;
        if (!adminCode || adminCode !== validAdminCode) {
            return res.status(403).json({ message: "Invalid admin code. Registration denied." });
        }

        const isAlreadyExistsFoodPartner = await FoodPartner.findOne({ email });

        if (isAlreadyExistsFoodPartner) {
            return res.status(400).json({ message: "Account already exists. Please login instead." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique partner token
        const partnerToken = crypto.randomBytes(16).toString('hex');

        const foodPartner = new FoodPartner({
            name,
            contactName,
            phone,
            address,
            email,
            password: hashedPassword,
            partnerToken: partnerToken
        })

        await foodPartner.save();
        res.status(201).json({
            message: "Admin account created successfully",
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                email: foodPartner.email,
                partnerToken: foodPartner.partnerToken
            }
        });
    }
    catch (err) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ message: isProduction ? "Registration failed. Please try again." : err.message });
    }
}

//======================================================================

// =====================login foodpartner ====================

async function loginFoodPartner(req, res) {
    try {
        const { email, password, adminCode } = req.body;

        // Verify admin code
        const ADMIN_CODE = process.env.ADMIN_CODE;
        if (!adminCode || adminCode !== ADMIN_CODE) {
            return res.status(403).json({ message: "Invalid admin code" });
        }

        const foodPartner = await FoodPartner.findOne({ email });

        if (!foodPartner) {
            return res.status(400).json({ message: "Admin account not found." });
        }

        const isMatch = await bcrypt.compare(password, foodPartner.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: foodPartner._id }, JWT_KEY);

        res.cookie("token", token, getCookieOptions());

        res.status(200).json({
            message: `Welcome back, ${foodPartner.name}!`,
            foodPartner: {
                id: foodPartner._id,
                name: foodPartner.name,
                email: foodPartner.email,
            },
            token: token
        });
    }
    catch (err) {
        res.status(500).json({ message: "Login failed. Please try again." });
    }
}
//======================================================================

// =====================logout user ====================

async function logoutUser(req, res) {
    res.clearCookie("token");
    res.status(200).json({
        message: "User logged out successfully !"
    });
}

//======================================================================

// =====================logout foodPartner ====================
async function logoutfoodPartner(req, res) {
    res.clearCookie("token");
    res.status(200).json({
        message: "Food partner logged out successfully !"
    });
}

// =====================register restaurant ====================
async function registerRestaurant(req, res) {
    try {
        const { name, description, cuisine, location } = req.body;
        const foodPartnerId = req.foodPartner?.id;

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        const foodPartner = await FoodPartner.findById(foodPartnerId);
        if (!foodPartner) {
            return res.status(404).json({ message: "Food partner not found" });
        }

        if (foodPartner.restaurant.isRegistered) {
            return res.status(400).json({ message: "Restaurant already registered for this partner" });
        }

        let imageUrl = '';

        // Handle image upload if provided
        if (req.file && req.file.buffer) {
            try {
                const uploadResult = await storageService.uploadFile(req.file.buffer, uuid());
                imageUrl = uploadResult.url;
            } catch (uploadErr) {
                // Not a hard failure for registration; continue without image
            }
        }

        foodPartner.restaurant = {
            name,
            description,
            cuisine,
            location,
            image: imageUrl,
            isRegistered: true,
            registrationDate: new Date()
        };

        await foodPartner.save();

        res.status(201).json({
            message: "Restaurant registered successfully",
            restaurant: foodPartner.restaurant
        });
    } catch (err) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ message: isProduction ? "Restaurant registration failed. Please try again." : err.message });
    }
}

// Public: list registered restaurants
async function listRestaurants(req, res) {
    try {
        const partners = await FoodPartner.find({ 'restaurant.isRegistered': true })
            .select('name contactName restaurant');

        const restaurants = partners.map(p => ({
            id: p._id,
            partnerName: p.name,
            contactName: p.contactName,
            name: p.restaurant?.name || '',
            description: p.restaurant?.description || '',
            cuisine: p.restaurant?.cuisine || '',
            location: p.restaurant?.location || '',
            image: p.restaurant?.image || '',
            registrationDate: p.restaurant?.registrationDate || null
        }));

        res.status(200).json({
            message: 'Restaurants fetched successfully',
            restaurants
        });
    } catch (err) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ message: isProduction ? 'Failed to fetch restaurants' : err.message });
    }
}

// =====================get partner profile ====================
async function getPartnerProfile(req, res) {
    try {
        const foodPartnerId = req.foodPartner?.id;

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        const foodPartner = await FoodPartner.findById(foodPartnerId).select('-password');
        if (!foodPartner) {
            return res.status(404).json({ message: "Food partner not found" });
        }

        res.status(200).json({
            message: "Partner profile fetched successfully",
            foodPartner
        });
    } catch (err) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ message: isProduction ? "Failed to fetch partner profile" : err.message });
    }
}

// =====================update profile picture ====================
async function updateProfilePicture(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        let imageUrl = '';
        try {
            const uploadResult = await storageService.uploadFile(req.file.buffer, `avatar_${uuid()}`);
            imageUrl = uploadResult.url;
        } catch (uploadErr) {
            return res.status(500).json({ message: 'Failed to upload image. Please try again.' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture: imageUrl },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile picture updated successfully",
            profilePicture: imageUrl,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                subscriptionStatus: user.subscriptionStatus || 'none',
            }
        });
    } catch (err) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(500).json({ message: isProduction ? "Failed to update profile picture" : err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutfoodPartner,
    registerRestaurant,
    getPartnerProfile,
    listRestaurants,
    updateProfilePicture,
};