
const dotenv = require('dotenv');
dotenv.config();

// FORCE MOCK MODE (User Request)
// FORCE MOCK MODE (User Request)
// process.env.GOOGLE_API_KEY deletion removed for production safety


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/config/logger');
const apiRoutes = require('./src/routes/apiRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const adminRoutes = require('./src/routes/admin');

const app = express();
const port = process.env.PORT || 5002;


// Database Connection
const sequelize = require('./src/config/database');
sequelize.sync()
    .then(() => logger.info('📦 Connected to SQLite DB'))
    .catch(err => logger.error('❌ DB connection error:', { error: err.message, stack: err.stack }));

// Security & Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(helmet());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
});

// Rate Limiting
const rateLimit = require('express-rate-limit');
const generateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many resume generation requests. Please wait a minute.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit -* ` headers
    legacyHeaders: false, // Disable the `X - RateLimit -* ` headers
});

// Apply rate limiter specifically to the expensive generation endpoint
app.use('/api/generate', generateLimiter);

// Routes
app.use('/', healthRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "Resume Generator API is Running 🚀", provider: "Google Gemini", model: "gemini-pro" });
});

app.listen(port, () => {
    logger.info(`🚀 Server running on http://localhost:${port}`);
    logger.info(`🔑 AI Service: ${process.env.GOOGLE_API_KEY ? "Online (Gemini)" : "Offline (Mock Mode)"}`);
    logger.info(`📊 Health check available at http://localhost:${port}/health`);
});
