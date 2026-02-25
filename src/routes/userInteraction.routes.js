const express = require('express');
const router = express.Router();
const {
    toggleLike,
    addComment,
    getComments,
    toggleSave,
    getUserInteractions,
    shareItem
} = require('../controllers/userInteraction.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/user.model');
const Food = require('../models/food.model');

// User interaction endpoints (authenticated users only)
router.post('/like/:foodId', authMiddleware, toggleLike);
router.post('/comment/:foodId', authMiddleware, addComment);
router.get('/comments/:foodId', getComments);
router.post('/save/:foodId', authMiddleware, toggleSave);
router.get('/interactions', authMiddleware, getUserInteractions);
router.post('/share/:foodId', shareItem);

// Cart endpoints
router.post('/cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { foodId, quantity = 1 } = req.body;

        if (!foodId) return res.status(400).json({ message: 'foodId is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const food = await Food.findById(foodId);
        if (!food) return res.status(404).json({ message: 'Food item not found' });

        if (!user.cart) user.cart = [];

        const existing = user.cart.find(c => c.foodItem.toString() === foodId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            user.cart.push({ foodItem: foodId, quantity });
        }

        await user.save();
        res.status(200).json({ message: 'Added to cart', cart: user.cart });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ message: 'Failed to add to cart' });
    }
});

router.get('/cart', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user?.id).populate('cart.foodItem');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ cart: user.cart });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch cart' });
    }
});

router.delete('/cart/:foodId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { foodId } = req.params;
        user.cart = (user.cart || []).filter(c => c.foodItem.toString() !== foodId);
        await user.save();
        res.status(200).json({ message: 'Removed from cart', cart: user.cart });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove from cart' });
    }
});

module.exports = router;








