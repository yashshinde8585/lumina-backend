const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./src/config/logger');
const sequelize = require('./src/config/database');

const apiRoutes = require('./src/routes/apiRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const adminRoutes = require('./src/routes/admin');

const app = express();
const port = process.env.PORT || 5002;

// --- Database ---
sequelize.authenticate()
    .then(async () => {
        logger.info('📦 Connected to SQLite DB');

        // Sync models to update schema automatically
        // Sync models to update schema automatically
        // 'alter: true' enabled to ensure schema updates (like adding 'status' column) are applied.
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synced successfully');
    })
    .catch(err => logger.error('❌ DB Connection Error:', err));

// --- Middleware ---
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000'];

logger.info(`🔧 CORS Configured for: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: (origin, callback) => {
        // Allow all in development, restrict in production
        // Strict check: origin must exactly match one of the allowed origins
        if (!isProduction || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`🚫 CORS Blocked Origin: ${origin}. Allowed: ${allowedOrigins}`);
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
    },
    credentials: true
}));

app.use(helmet());
app.use(express.json());

// Request Logging
app.use(compression());
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        logger.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${Date.now() - start}ms`,
            ip: req.ip
        });
    });
    next();
});

// Rate Limiting for Generation
const generateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many requests. Please wait a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/generate', generateLimiter);

// --- Routes ---
app.use('/', healthRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({
        status: "Online 🚀",
        service: "Resume AI API",
        provider: "Gemini Pro"
    });
});

// --- Start Server ---
app.listen(port, () => {
    logger.info(`🚀 Server running on http://localhost:${port}`);
    logger.info(`🔑 AI Service: ${process.env.GOOGLE_API_KEY ? "Online" : "Mock Mode"}`);
});
