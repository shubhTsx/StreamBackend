const Food = require('../models/food.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Like/Unlike a food item or reel
async function toggleLike(req, res) {
    try {
        const { foodId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }

        const foodItem = await Food.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // Check if user already liked this item
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Initialize likedItems array if it doesn't exist
        if (!user.likedItems) {
            user.likedItems = [];
        }

        const isLiked = user.likedItems.includes(foodId);

        if (isLiked) {
            // Unlike
            user.likedItems = user.likedItems.filter(id => id.toString() !== foodId);
            foodItem.likes = Math.max(0, foodItem.likes - 1);
        } else {
            // Like
            user.likedItems.push(foodId);
            foodItem.likes = (foodItem.likes || 0) + 1;
        }

        await user.save();
        await foodItem.save();

        res.status(200).json({
            message: isLiked ? "Unliked successfully" : "Liked successfully",
            isLiked: !isLiked,
            totalLikes: foodItem.likes
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: "Error updating like status" });
    }
}

// Add comment to a food item or reel
async function addComment(req, res) {
    try {
        const { foodId } = req.params;
        const { text } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const foodItem = await Food.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Initialize comments array if it doesn't exist
        if (!foodItem.comments) {
            foodItem.comments = [];
        }

        const newComment = {
            text: text.trim(),
            user: user.name,
            userId: userId,
            timestamp: new Date()
        };

        foodItem.comments.push(newComment);
        await foodItem.save();

        res.status(201).json({
            message: "Comment added successfully",
            comment: newComment,
            totalComments: foodItem.comments.length
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: "Error adding comment" });
    }
}

// Get comments for a food item or reel
async function getComments(req, res) {
    try {
        const { foodId } = req.params;
        const { limit = 20, page = 1 } = req.query;

        const foodItem = await Food.findById(foodId).select('comments');
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const skip = (page - 1) * limit;
        const comments = foodItem.comments
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(skip, skip + parseInt(limit));

        res.status(200).json({
            message: "Comments fetched successfully",
            comments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(foodItem.comments.length / limit),
                totalComments: foodItem.comments.length,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: "Error fetching comments" });
    }
}

// Save/Unsave a food item or reel
async function toggleSave(req, res) {
    try {
        const { foodId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }

        const foodItem = await Food.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Initialize savedItems array if it doesn't exist
        if (!user.savedItems) {
            user.savedItems = [];
        }

        const isSaved = user.savedItems.includes(foodId);

        if (isSaved) {
            // Unsave
            user.savedItems = user.savedItems.filter(id => id.toString() !== foodId);
        } else {
            // Save
            user.savedItems.push(foodId);
        }

        await user.save();

        res.status(200).json({
            message: isSaved ? "Unsaved successfully" : "Saved successfully",
            isSaved: !isSaved
        });
    } catch (error) {
        console.error('Error toggling save:', error);
        res.status(500).json({ message: "Error updating save status" });
    }
}

// Get user's liked and saved items
async function getUserInteractions(req, res) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }

        const user = await User.findById(userId).select('likedItems savedItems');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get liked items details
        const likedItems = await Food.find({ _id: { $in: user.likedItems || [] } })
            .populate('foodPartner', 'name contactName restaurant')
            .select('foodname description price video thumbnail category isReel likes comments');

        // Get saved items details
        const savedItems = await Food.find({ _id: { $in: user.savedItems || [] } })
            .populate('foodPartner', 'name contactName restaurant')
            .select('foodname description price video thumbnail category isReel likes comments');

        res.status(200).json({
            message: "User interactions fetched successfully",
            likedItems,
            savedItems,
            stats: {
                totalLiked: likedItems.length,
                totalSaved: savedItems.length
            }
        });
    } catch (error) {
        console.error('Error fetching user interactions:', error);
        res.status(500).json({ message: "Error fetching user interactions" });
    }
}

// Share a food item or reel (increment share count)
async function shareItem(req, res) {
    try {
        const { foodId } = req.params;

        const foodItem = await Food.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        // Increment share count
        if (foodItem.isReel && foodItem.reelData) {
            foodItem.reelData.shares = (foodItem.reelData.shares || 0) + 1;
        } else {
            // For regular food items, we can add a share count field
            foodItem.shares = (foodItem.shares || 0) + 1;
        }

        await foodItem.save();

        res.status(200).json({
            message: "Item shared successfully",
            totalShares: foodItem.isReel ? foodItem.reelData.shares : foodItem.shares
        });
    } catch (error) {
        console.error('Error sharing item:', error);
        res.status(500).json({ message: "Error sharing item" });
    }
}

module.exports = {
    toggleLike,
    addComment,
    getComments,
    toggleSave,
    getUserInteractions,
    shareItem
};












