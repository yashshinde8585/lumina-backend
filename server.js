const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
        // Manually check/add column for SQLite due to alter:true bugs
        const [results] = await sequelize.query("PRAGMA table_info(Users)");

        const hasJobBoardColumn = results.some(column => column.name === 'jobBoardData');
        if (!hasJobBoardColumn) {
            logger.info('Adding jobBoardData column to Users table...');
            await sequelize.query("ALTER TABLE Users ADD COLUMN jobBoardData JSON");
        }

        const hasRoleColumn = results.some(column => column.name === 'role');
        if (!hasRoleColumn) {
            logger.info('Adding role column to Users table...');
            await sequelize.query("ALTER TABLE Users ADD COLUMN role TEXT DEFAULT 'user'");
        }

        return sequelize.sync();
    })
    .catch(err => logger.error('❌ DB Connection Error:', err));

// --- Middleware ---
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow all in development, restrict in production
        if (!isProduction || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(helmet());
app.use(express.json());

// Request Logging
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
