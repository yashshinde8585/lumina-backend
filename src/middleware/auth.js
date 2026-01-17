const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('../utils/constants');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication failed: No token provided' });
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication failed: Invalid token format' });
        }

        // Use fallback if env is missing (matching authController logic for dev stability)
        const secret = process.env.JWT_SECRET || 'dev_secret_fallback_123';
        const decoded = jwt.verify(token, secret);
        req.userData = { userId: decoded.userId, email: decoded.email };
        next();
    } catch (error) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authentication failed: Invalid token' });
    }
};
