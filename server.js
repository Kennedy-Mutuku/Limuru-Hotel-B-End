const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database - Handled async after server start
// connectDB();

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// DB Health Check Middleware - Fail fast if DB is disconnected
const dbCheck = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Database connection is currently unavailable. Please ensure your local MongoDB service is running.'
        });
    }
    next();
};

// Use dbCheck for all API routes that require DB access
app.use('/api', dbCheck);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Jumuia Resorts API' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/tenders', require('./routes/tenderRoutes'));

// Port
const PORT = process.env.PORT || 5000;

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const seedAdmin = async () => {
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
        console.warn('Skipping seeder: Database not connected');
        return;
    }

    try {
        const User = require('./models/User');
        const adminExists = await User.findOne({ email: 'generalmanager@jumuiaresorts.com' });
        if (!adminExists) {
            await User.create({
                name: 'General Manager',
                email: 'generalmanager@jumuiaresorts.com',
                password: '12345678', // Note: This will be hashed by the model pre-save hook
                role: 'general-manager',
                properties: ['limuru', 'kanamai', 'kisumu']
            });
            console.log('Seeded initial admin user');
        }
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

// Use a self-invoking function to avoid top-level await if needed, 
// though we just want it to run in background.
connectDB().then(() => {
    seedAdmin();
});


app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Trigger redeploy - Fix validation once and for all
