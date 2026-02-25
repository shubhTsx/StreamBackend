const express = require('express');
const router = express.Router();
const {
    createFood,
    getFoodItems,
    getVideos,
    addComment,
    deleteFood,
    addFoodReel,
    searchFood,
    getExploreFood,
    getReels
} = require('../controllers/food.controller');
const { authFoodPartnerMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage()
})

// Food item endpoints (thumbnail-only upload)
router.post('/', upload.single("thumbnail"), authFoodPartnerMiddleware, createFood);
router.get('/items', getFoodItems);
router.get('/explore', getExploreFood);

// Reel endpoints (partners only) - accept both video and thumbnail files
router.post('/reels', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
]), authFoodPartnerMiddleware, addFoodReel);
router.get('/reels', getReels);

// Video endpoints
router.get('/videos', getVideos);
router.post('/videos/:videoId/comments', addComment);

// Search endpoint
router.get('/search', searchFood);

// Food management endpoints
router.delete('/:foodId', authFoodPartnerMiddleware, deleteFood);

module.exports = router;