const FoodModel = require('../models/food.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');

async function createFood(req, res) {
    try {
        console.log('createFood called with body:', req.body);
        console.log('createFood called with file:', req.file);
        console.log('createFood foodPartner:', req.foodPartner);

        // Handle form data with potential trailing spaces
        const { foodname, description, price, category, ingredients, isAvailable, isReel, hashtags, location } = req.body;

        // Clean up the data - handle fields with trailing spaces and trim all keys
        const cleanBody = {};
        Object.keys(req.body).forEach(key => {
            const cleanKey = key.trim();
            cleanBody[cleanKey] = req.body[key];
        });

        const cleanPrice = cleanBody.price || cleanBody['price '] || '0';
        const cleanDescription = cleanBody.description || cleanBody['description '] || '';

        console.log('Original price:', price);
        console.log('Cleaned price:', cleanPrice);
        console.log('Original description:', description);
        console.log('Cleaned description:', cleanDescription);
        console.log('Clean body keys:', Object.keys(cleanBody));

        // Get food partner ID from auth middleware
        const foodPartnerId = req.foodPartner?.id;

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        let videoUrl = '';
        let thumbnailUrl = '';

        // Handle thumbnail upload (file)
        if (req.file) {
            const fileUploadResult = await storageService.uploadFile(req.file.buffer, uuid());
            thumbnailUrl = fileUploadResult.url;
        }

        // Handle thumbnail url if provided (fallback)
        if (!thumbnailUrl && req.body.thumbnail) {
            thumbnailUrl = req.body.thumbnail;
        }

        // Validate and parse price
        const parsedPrice = parseFloat(cleanPrice);
        const validPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

        console.log('Parsed price:', parsedPrice);
        console.log('Valid price:', validPrice);

        const foodItemData = {
            foodname,
            description: cleanDescription,
            price: validPrice,
            category,
            ingredients,
            image: undefined,
            thumbnail: thumbnailUrl,
            isAvailable: isAvailable === 'true' || isAvailable === true,
            isReel: isReel === 'true' || isReel === true,
            foodPartner: foodPartnerId,
        };

        // Add reel data if it's a reel
        if (foodItemData.isReel) {
            foodItemData.reelData = {
                duration: 0,
                views: 0,
                shares: 0,
                hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
                location: location || ''
            };
        }

        const foodItem = new FoodModel(foodItemData);

        await foodItem.save();

        res.status(201).json({
            message: "Food item created successfully",
            food: foodItem
        });
    }
    catch (err) {
        console.error('Error creating food:', err);
        res.status(500).json({ message: err.message || "Something went wrong" });
    }
}

async function getFoodItems(req, res) {
    try {
        const foodItems = await FoodModel.find({})
            .populate('foodPartner', 'name contactName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Food items fetched successfully!",
            foodItems,
        });
    } catch (error) {
        console.error('Error fetching food items:', error);
        res.status(500).json({ message: "Error fetching food items" });
    }
}

// Get all videos for the video feed
async function getVideos(req, res) {
    try {
        const videos = await FoodModel.find({})
            .populate('foodPartner', 'name contactName')
            .sort({ createdAt: -1 });

        // If no videos in database, return mock data for testing
        if (videos.length === 0) {
            const mockVideos = [
                {
                    id: 'mock1',
                    title: "Amazing Pizza Making",
                    restaurant: "Tony's Pizza",
                    likes: 1234,
                    comments: 89,
                    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop",
                    description: "Watch our chef create the perfect Margherita pizza from scratch",
                    foodItem: {
                        name: "Pizza Margherita",
                        price: 12.99,
                        ingredients: "Fresh mozzarella, tomato sauce, basil"
                    }
                },
                {
                    id: 'mock2',
                    title: "Sushi Master at Work",
                    restaurant: "Sakura Sushi",
                    likes: 2567,
                    comments: 156,
                    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
                    thumbnail: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop",
                    description: "Experience the art of sushi making with our master chef",
                    foodItem: {
                        name: "Salmon Sushi Platter",
                        price: 18.99,
                        ingredients: "Fresh salmon, rice, seaweed, wasabi"
                    }
                },
                {
                    id: 'mock3',
                    title: "Burger Assembly",
                    restaurant: "Burger Palace",
                    likes: 3456,
                    comments: 234,
                    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                    thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop",
                    description: "See how we build our signature deluxe burger",
                    foodItem: {
                        name: "Deluxe Burger",
                        price: 15.99,
                        ingredients: "Beef patty, cheese, lettuce, tomato, special sauce"
                    }
                }
            ];
            return res.status(200).json(mockVideos);
        }

        // Transform the data to match frontend expectations
        const transformedVideos = videos.map(video => ({
            id: video._id,
            title: video.foodname,
            restaurant: video.foodPartner?.name || 'Unknown Restaurant',
            likes: video.likes || 0,
            comments: video.comments?.length || 0,
            videoUrl: video.video,
            thumbnail: video.thumbnail || video.video, // Use video as thumbnail if no separate thumbnail
            description: video.description,
            foodItem: {
                name: video.foodname,
                price: video.price || 0,
                ingredients: video.ingredients || 'Fresh ingredients'
            }
        }));

        res.status(200).json(transformedVideos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Error fetching videos' });
    }
}

// Add comment to a video
async function addComment(req, res) {
    try {
        const { videoId } = req.params;
        const { text } = req.body;

        // For mock videos, just return success
        if (videoId.startsWith('mock')) {
            return res.status(201).json({
                message: 'Comment added successfully',
                comment: {
                    id: Date.now(),
                    text,
                    user: 'You',
                    timestamp: new Date()
                }
            });
        }

        const video = await FoodModel.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Initialize comments array if it doesn't exist
        if (!video.comments) {
            video.comments = [];
        }

        const comment = {
            text,
            user: 'Anonymous', // You can get this from auth middleware
            timestamp: new Date()
        };

        video.comments.push(comment);
        await video.save();

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
}

// Delete food item
async function deleteFood(req, res) {
    try {
        const { foodId } = req.params;

        const foodItem = await FoodModel.findById(foodId);
        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if the food item belongs to the authenticated food partner
        if (foodItem.foodPartner.toString() !== req.foodPartner.id) {
            return res.status(403).json({ message: 'Not authorized to delete this food item' });
        }

        await FoodModel.findByIdAndDelete(foodId);

        res.status(200).json({
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting food item:', error);
        res.status(500).json({ message: 'Error deleting food item' });
    }
}

// Add food reel (for partners only)
async function addFoodReel(req, res) {
    try {
        const { foodname, description, price, category, ingredients, hashtags, location } = req.body;

        // Get food partner ID from auth middleware
        const foodPartnerId = req.foodPartner?.id;

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        let videoUrl = '';
        let thumbnailUrl = '';

        // Handle video upload (multipart fields)
        if (req.files && req.files.video && req.files.video[0]) {
            const fileUploadResult = await storageService.uploadFile(req.files.video[0].buffer, uuid());
            videoUrl = fileUploadResult.url;
        }

        // Handle thumbnail upload if provided as file or URL
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            const thumbUpload = await storageService.uploadFile(req.files.thumbnail[0].buffer, uuid());
            thumbnailUrl = thumbUpload.url;
        } else if (req.body.thumbnail) {
            thumbnailUrl = req.body.thumbnail;
        }

        // Validate and parse price
        const parsedPrice = parseFloat(price);
        const validPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

        const foodReel = new FoodModel({
            foodname,
            description,
            price: validPrice,
            category,
            ingredients,
            video: videoUrl,
            thumbnail: thumbnailUrl,
            isAvailable: true,
            isReel: true,
            foodPartner: foodPartnerId,
            reelData: {
                duration: 0, // You can calculate this from video metadata
                views: 0,
                shares: 0,
                hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
                location: location || ''
            }
        });

        await foodReel.save();

        res.status(201).json({
            message: "Food reel created successfully",
            foodReel
        });
    } catch (err) {
        console.error('Error creating food reel:', err);
        res.status(500).json({ message: err.message || "Something went wrong" });
    }
}

// Search food items and reels
async function searchFood(req, res) {
    try {
        const { query, category, type } = req.query;

        let searchCriteria = {};

        // Text search
        if (query) {
            searchCriteria.$or = [
                { foodname: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { ingredients: { $regex: query, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            searchCriteria.category = { $regex: category, $options: 'i' };
        }

        // Type filter (food item or reel)
        if (type === 'reel') {
            searchCriteria.isReel = true;
        } else if (type === 'food') {
            searchCriteria.isReel = false;
        }

        const results = await FoodModel.find(searchCriteria)
            .populate('foodPartner', 'name contactName restaurant')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Search completed successfully",
            results,
            total: results.length
        });
    } catch (error) {
        console.error('Error searching food:', error);
        res.status(500).json({ message: "Error searching food items" });
    }
}

// Get food items for explore section (includes both regular items and reels)
async function getExploreFood(req, res) {
    try {
        const { category, limit = 20, page = 1 } = req.query;

        let searchCriteria = { isAvailable: true };

        if (category && category !== 'All') {
            searchCriteria.category = { $regex: category, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const foodItems = await FoodModel.find(searchCriteria)
            .populate('foodPartner', 'name contactName restaurant')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await FoodModel.countDocuments(searchCriteria);

        res.status(200).json({
            message: "Explore food items fetched successfully",
            foodItems,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching explore food:', error);
        res.status(500).json({ message: "Error fetching explore food items" });
    }
}

// Get reels for video feed
async function getReels(req, res) {
    try {
        const { limit = 10, page = 1 } = req.query;

        const skip = (page - 1) * limit;

        const reels = await FoodModel.find({ isReel: true })
            .populate('foodPartner', 'name contactName restaurant')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await FoodModel.countDocuments({ isReel: true });

        // Transform the data to match frontend expectations
        const transformedReels = reels.map(reel => ({
            id: reel._id,
            title: reel.foodname,
            restaurant: reel.foodPartner?.restaurant?.name || reel.foodPartner?.name || 'Unknown Restaurant',
            likes: reel.likes || 0,
            comments: reel.comments?.length || 0,
            videoUrl: reel.video,
            thumbnail: reel.thumbnail || reel.video,
            description: reel.description,
            foodItem: {
                name: reel.foodname,
                price: reel.price || 0,
                ingredients: reel.ingredients || 'Fresh ingredients'
            },
            reelData: reel.reelData,
            hashtags: reel.reelData?.hashtags || [],
            location: reel.reelData?.location || ''
        }));

        res.status(200).json({
            message: "Reels fetched successfully",
            reels: transformedReels,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reels:', error);
        res.status(500).json({ message: "Error fetching reels" });
    }
}

module.exports = {
    createFood,
    getFoodItems,
    getVideos,
    addComment,
    deleteFood,
    addFoodReel,
    searchFood,
    getExploreFood,
    getReels,
}