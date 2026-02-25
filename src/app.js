const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./db/db');
const authRoutes = require('./routes/auth.routes');
const cookieParser = require('cookie-parser');
const foodRouter = require('./routes/food.routes');
const analyticsRouter = require('./routes/analytics.routes');
const userInteractionRouter = require('./routes/userInteraction.routes');
const subscriptionRouter = require('./routes/subscription.routes');


connectDB();

// Add CORS configuration for local and deployed frontends
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow mobile apps / curl with no origin, or explicitly allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type']
}));

// Handle preflight
// Preflight is handled by the global CORS middleware above

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("working !");
})

app.use('/', authRoutes);
app.use('/food', foodRouter);
app.use('/analytics', analyticsRouter);
app.use('/user', userInteractionRouter);
app.use('/subscription', subscriptionRouter);
module.exports = app;