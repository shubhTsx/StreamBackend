const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');

// User: submit a subscription payment
async function submitSubscription(req, res) {
    try {
        const userId = req.user._id;
        const { utrCode } = req.body;

        if (!utrCode || !utrCode.trim()) {
            return res.status(400).json({ message: 'UTR code is required' });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'Payment screenshot is required' });
        }

        // Check if user already has a pending or approved subscription
        const existing = await Subscription.findOne({
            user: userId,
            status: { $in: ['pending', 'approved'] }
        });

        if (existing && existing.status === 'approved') {
            return res.status(400).json({ message: 'You already have an active subscription' });
        }

        if (existing && existing.status === 'pending') {
            return res.status(400).json({ message: 'You already have a pending subscription request. Please wait for approval.' });
        }

        // Upload screenshot to ImageKit
        let screenshotUrl = '';
        try {
            const uploadResult = await storageService.uploadFile(req.file.buffer, `payment_${uuid()}`);
            screenshotUrl = uploadResult.url;
        } catch (uploadErr) {
            return res.status(500).json({ message: 'Failed to upload payment screenshot. Please try again.' });
        }

        // Create subscription record
        const subscription = new Subscription({
            user: userId,
            utrCode: utrCode.trim(),
            screenshotUrl,
            status: 'pending'
        });

        await subscription.save();

        // Update user's subscription status
        await User.findByIdAndUpdate(userId, { subscriptionStatus: 'pending' });

        res.status(201).json({
            message: 'Subscription request submitted successfully. Please wait for approval.',
            subscription: {
                id: subscription._id,
                status: subscription.status,
                utrCode: subscription.utrCode,
                amount: subscription.amount,
                createdAt: subscription.createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit subscription. Please try again.' });
    }
}

// User: get their subscription status
async function getSubscriptionStatus(req, res) {
    try {
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ user: userId })
            .sort({ createdAt: -1 })
            .select('-__v');

        const user = await User.findById(userId).select('subscriptionStatus');

        res.status(200).json({
            subscriptionStatus: user?.subscriptionStatus || 'none',
            subscription: subscription || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch subscription status' });
    }
}

// Partner: get all pending subscriptions
async function getPendingSubscriptions(req, res) {
    try {
        const subscriptions = await Subscription.find({ status: 'pending' })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Pending subscriptions fetched successfully',
            subscriptions
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending subscriptions' });
    }
}

// Partner: get all subscriptions (all statuses)
async function getAllSubscriptions(req, res) {
    try {
        const subscriptions = await Subscription.find()
            .populate('user', 'name email')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'All subscriptions fetched successfully',
            subscriptions
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
}

// Partner: approve a subscription
async function approveSubscription(req, res) {
    try {
        const { id } = req.params;
        const partnerId = req.foodPartner._id;

        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status === 'approved') {
            return res.status(400).json({ message: 'Subscription is already approved' });
        }

        subscription.status = 'approved';
        subscription.approvedBy = partnerId;
        await subscription.save();

        // Update user's subscription status
        await User.findByIdAndUpdate(subscription.user, { subscriptionStatus: 'approved' });

        res.status(200).json({
            message: 'Subscription approved successfully',
            subscription
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to approve subscription' });
    }
}

// Partner: reject a subscription
async function rejectSubscription(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status === 'approved') {
            return res.status(400).json({ message: 'Cannot reject an already approved subscription' });
        }

        subscription.status = 'rejected';
        subscription.rejectedReason = reason || 'Payment could not be verified';
        await subscription.save();

        // Update user's subscription status
        await User.findByIdAndUpdate(subscription.user, { subscriptionStatus: 'rejected' });

        res.status(200).json({
            message: 'Subscription rejected',
            subscription
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to reject subscription' });
    }
}

module.exports = {
    submitSubscription,
    getSubscriptionStatus,
    getPendingSubscriptions,
    getAllSubscriptions,
    approveSubscription,
    rejectSubscription
};
