const logger = require('../config/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
    // Log the error details internally
    logger.error('Unhandled Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Provide a generic error message to the client in production
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        // Optional: Include operational error codes if defined
        code: err.code || 'INTERNAL_ERROR'
    });
};

module.exports = errorHandler;
