const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db/db');
const authRoutes = require('./routes/auth.routes');
const cookieParser = require('cookie-parser');
const foodRouter = require('./routes/food.routes');
const analyticsRouter = require('./routes/analytics.routes');
const userInteractionRouter = require('./routes/userInteraction.routes');
const subscriptionRouter = require('./routes/subscription.routes');

connectDB();

const isProduction = process.env.NODE_ENV === 'production';

// Security headers — allow cross-origin resources
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later.' }
});

app.use(generalLimiter);

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    ...(isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // In production, block requests with no origin
        if (!origin && isProduction) {
            return callback(new Error('Not allowed by CORS'));
        }
        // In development, allow no-origin (mobile apps, curl, etc.)
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

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("OK");
});

// Routes — auth limiter only on login/register, not all auth routes
app.use('/', authRoutes);
app.use('/food', foodRouter);
app.use('/analytics', analyticsRouter);
app.use('/user', userInteractionRouter);
app.use('/subscription', subscriptionRouter);

// Global error handler — never leak internal details
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: isProduction ? 'Something went wrong' : err.message
    });
});

module.exports = app;