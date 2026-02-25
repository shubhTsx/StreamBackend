const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authFoodPartnerMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
});

//======== user auth APIs ===================
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);
router.post('/user/logout', authController.logoutUser);
router.post('/user/profile-picture', upload.single('profilePicture'), require('../middleware/authMiddleware').authMiddleware, authController.updateProfilePicture);

//======== foodPartner auth APIs ===================
router.post('/foodPartner/login', authController.loginFoodPartner);
router.post('/foodPartner/register', authController.registerFoodPartner);
router.post('/foodPartner/logout', authController.logoutfoodPartner);

//======== foodPartner profile and restaurant APIs ===================
router.get('/foodPartner/profile', authFoodPartnerMiddleware, authController.getPartnerProfile);
router.post('/foodPartner/restaurant', upload.single('image'), authFoodPartnerMiddleware, authController.registerRestaurant);
router.get('/restaurants', authController.listRestaurants);

module.exports = router;