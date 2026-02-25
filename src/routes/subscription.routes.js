const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authMiddleware, authFoodPartnerMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
});

// User routes
router.post('/submit', authMiddleware, upload.single('screenshot'), subscriptionController.submitSubscription);
router.get('/status', authMiddleware, subscriptionController.getSubscriptionStatus);

// Partner routes
router.get('/pending', authFoodPartnerMiddleware, subscriptionController.getPendingSubscriptions);
router.get('/all', authFoodPartnerMiddleware, subscriptionController.getAllSubscriptions);
router.patch('/:id/approve', authFoodPartnerMiddleware, subscriptionController.approveSubscription);
router.patch('/:id/reject', authFoodPartnerMiddleware, subscriptionController.rejectSubscription);

module.exports = router;
