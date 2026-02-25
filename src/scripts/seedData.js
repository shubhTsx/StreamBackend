const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const FoodPartner = require('../models/foodPartner.model');
const Food = require('../models/food.model');
const User = require('../models/user.model');
require('dotenv').config();

async function seedData() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zomato');
        console.log('Connected to database');

        // Clear existing data
        await FoodPartner.deleteMany({});
        await Food.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data');

        // Create test food partner
        const hashedPassword = await bcrypt.hash('password123', 10);

        const testPartner = new FoodPartner({
            name: 'Test Restaurant',
            contactName: 'John Doe',
            phone: 1234567890,
            address: '123 Test Street, Test City',
            email: 'test@restaurant.com',
            password: hashedPassword,
            partnerToken: 'TEST_TOKEN_123',
            restaurant: {
                name: 'Test Restaurant',
                description: 'A test restaurant for development',
                cuisine: 'Italian',
                location: 'Test City',
                isRegistered: true,
                registrationDate: new Date()
            }
        });

        await testPartner.save();
        console.log('Created test food partner');

        // Create test user
        const testUser = new User({
            name: 'Test User',
            email: 'test@user.com',
            password: hashedPassword
        });

        await testUser.save();
        console.log('Created test user');

        // Create test food items
        const testFoods = [
            {
                foodname: 'Test Pizza',
                description: 'A delicious test pizza',
                price: 12.99,
                category: 'Pizza',
                ingredients: 'Dough, cheese, tomato sauce',
                video: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                isAvailable: true,
                isReel: false,
                foodPartner: testPartner._id,
                likes: 0,
                comments: []
            },
            {
                foodname: 'Test Burger',
                description: 'A juicy test burger',
                price: 15.99,
                category: 'Burger',
                ingredients: 'Beef patty, lettuce, tomato, cheese',
                video: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
                isAvailable: true,
                isReel: false,
                foodPartner: testPartner._id,
                likes: 0,
                comments: []
            },
            {
                foodname: 'Test Reel',
                description: 'A test food reel',
                price: 18.99,
                category: 'Pasta',
                ingredients: 'Pasta, sauce, cheese',
                video: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
                isAvailable: true,
                isReel: true,
                foodPartner: testPartner._id,
                likes: 0,
                comments: [],
                reelData: {
                    duration: 30,
                    views: 0,
                    shares: 0,
                    hashtags: ['#test', '#pasta', '#delicious'],
                    location: 'Test City'
                }
            }
        ];

        for (const foodData of testFoods) {
            const food = new Food(foodData);
            await food.save();
        }
        console.log('Created test food items');

        console.log('Data seeding completed successfully!');
        console.log('Test credentials:');
        console.log('Partner: test@restaurant.com / password123');
        console.log('User: test@user.com / password123');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

seedData();












