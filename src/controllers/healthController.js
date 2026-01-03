const sequelize = require('../config/database');
const logger = require('../config/logger');

/**
 * Health check endpoint
 * Checks database connectivity and service status
 */
exports.healthCheck = async (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        checks: {}
    };

    try {
        // Database health check
        await sequelize.authenticate();
        healthStatus.checks.database = {
            status: 'healthy',
            message: 'Database connection successful'
        };
    } catch (error) {
        healthStatus.status = 'unhealthy';
        healthStatus.checks.database = {
            status: 'unhealthy',
            message: error.message
        };
        logger.error('Health check failed - Database', { error: error.message });
    }

    // AI Service health check
    healthStatus.checks.aiService = {
        status: process.env.GOOGLE_API_KEY ? 'configured' : 'mock-mode',
        message: process.env.GOOGLE_API_KEY ? 'Gemini API key configured' : 'Running in mock mode'
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    healthStatus.checks.memory = {
        status: 'healthy',
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
};
