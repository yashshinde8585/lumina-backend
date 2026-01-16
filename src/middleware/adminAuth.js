const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // req.userData is populated by the auth middleware
        if (!req.userData) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.userData.userId;
        const userEmail = req.userData.email;

        // 1. Maintain existing hardcoded admin access (Legacy/MVP support)
        if (userEmail === 'admin@resumeai.com') {
            return next();
        }

        // 2. Check Database Role (RBAC)
        const user = await User.findByPk(userId);
        if (user && user.role === 'admin') {
            return next();
        }

        // If neither, deny access
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });

    } catch (error) {
        return res.status(500).json({ message: 'Authorization error', error: error.message });
    }
};
