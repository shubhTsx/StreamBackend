const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalytics } = require('../controllers/analytics.controller');
const { authFoodPartnerMiddleware } = require('../middleware/authMiddleware');

// Analytics endpoints (partners only)
router.get('/dashboard', authFoodPartnerMiddleware, getDashboardStats);
router.get('/analytics', authFoodPartnerMiddleware, getAnalytics);

module.exports = router;









