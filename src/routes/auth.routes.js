const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authFoodPartnerMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const upload = multer({
    storage: multer.memoryStorage()
});

// Rate limit only login/register endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later.' }
});

//======== user auth APIs ===================
router.post('/user/register', authLimiter, authController.registerUser);
router.post('/user/login', authLimiter, authController.loginUser);
router.post('/user/logout', authController.logoutUser);
router.post('/user/profile-picture', upload.single('profilePicture'), require('../middleware/authMiddleware').authMiddleware, authController.updateProfilePicture);

//======== foodPartner auth APIs ===================
router.post('/foodPartner/login', authLimiter, authController.loginFoodPartner);
router.post('/foodPartner/register', authLimiter, authController.registerFoodPartner);
router.post('/foodPartner/logout', authController.logoutfoodPartner);

//======== foodPartner profile and restaurant APIs ===================
router.get('/foodPartner/profile', authFoodPartnerMiddleware, authController.getPartnerProfile);
router.post('/foodPartner/restaurant', upload.single('image'), authFoodPartnerMiddleware, authController.registerRestaurant);
router.get('/restaurants', authController.listRestaurants);

module.exports = router;