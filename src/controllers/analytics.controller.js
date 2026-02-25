const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Review = require('../models/review.model');
const Food = require('../models/food.model');
const Analytics = require('../models/analytics.model');

// Get dashboard statistics for a food partner
async function getDashboardStats(req, res) {
    try {
        const foodPartnerId = req.foodPartner?.id;

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        // Get total orders
        const totalOrders = await Order.countDocuments({ foodPartner: foodPartnerId });

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId) } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get average rating
        const ratingResult = await Review.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId) } },
            { $group: { _id: null, average: { $avg: "$rating" } } }
        ]);
        const averageRating = ratingResult.length > 0 ? Math.round(ratingResult[0].average * 10) / 10 : 0;

        // Get total food items
        const totalFoods = await Food.countDocuments({ foodPartner: foodPartnerId });

        // Get recent orders
        const recentOrders = await Order.find({ foodPartner: foodPartnerId })
            .populate('user', 'name email')
            .populate('items.foodItem', 'foodname')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get top performing food items
        const topFoods = await Order.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId) } },
            { $unwind: "$items" },
            { $group: { _id: "$items.foodItem", totalOrders: { $sum: "$items.quantity" } } },
            { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "foodItem" } },
            { $unwind: "$foodItem" },
            { $project: { foodname: "$foodItem.foodname", totalOrders: 1 } },
            { $sort: { totalOrders: -1 } },
            { $limit: 5 }
        ]);

        // Get monthly revenue for chart
        const monthlyRevenue = await Order.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId) } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 }
        ]);

        res.status(200).json({
            message: "Dashboard stats fetched successfully",
            stats: {
                totalOrders,
                totalRevenue,
                averageRating,
                totalFoods
            },
            recentOrders,
            topFoods,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: "Error fetching dashboard statistics" });
    }
}

// Get analytics data for a specific period
async function getAnalytics(req, res) {
    try {
        const foodPartnerId = req.foodPartner?.id;
        const { period = '30' } = req.query; // days

        if (!foodPartnerId) {
            return res.status(401).json({ message: "Food partner authentication required" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get orders in period
        const ordersInPeriod = await Order.find({
            foodPartner: foodPartnerId,
            createdAt: { $gte: startDate }
        });

        // Get reviews in period
        const reviewsInPeriod = await Review.find({
            foodPartner: foodPartnerId,
            createdAt: { $gte: startDate }
        });

        // Calculate metrics
        const totalOrders = ordersInPeriod.length;
        const totalRevenue = ordersInPeriod.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageRating = reviewsInPeriod.length > 0
            ? reviewsInPeriod.reduce((sum, review) => sum + review.rating, 0) / reviewsInPeriod.length
            : 0;

        // Get daily breakdown
        const dailyStats = await Order.aggregate([
            { $match: { foodPartner: new mongoose.Types.ObjectId(foodPartnerId), createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    orders: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            message: "Analytics data fetched successfully",
            period: parseInt(period),
            metrics: {
                totalOrders,
                totalRevenue,
                averageRating,
                totalReviews: reviewsInPeriod.length
            },
            dailyStats
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: "Error fetching analytics data" });
    }
}

module.exports = {
    getDashboardStats,
    getAnalytics
};
