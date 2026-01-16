const User = require('../models/User');
const Resume = require('../models/Resume');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Get all users with stats
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'credits', 'createdAt', 'updatedAt'],
            include: [{
                model: Resume,
                attributes: ['id'],
                required: false
            }],
            order: [['createdAt', 'DESC']]
        });

        const usersWithStats = users.map(user => {
            const userData = user.toJSON();
            return {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                plan: userData.credits > 5 ? 'Pro' : 'Free',
                resumes: userData.Resumes ? userData.Resumes.length : 0,
                spent: 0, // TODO: Implement payment tracking
                lastActive: getTimeAgo(userData.updatedAt),
                status: 'Active',
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            users: usersWithStats,
            total: usersWithStats.length
        });
    } catch (error) {

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'credits', 'createdAt', 'updatedAt'],
            include: [{
                model: Resume,
                attributes: ['id', 'title', 'createdAt', 'updatedAt']
            }]
        });

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = user.toJSON();
        const userWithStats = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            plan: userData.credits > 5 ? 'Pro' : 'Free',
            resumes: userData.Resumes || [],
            resumeCount: userData.Resumes ? userData.Resumes.length : 0,
            spent: 0,
            lastActive: getTimeAgo(userData.updatedAt),
            status: 'Active',
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };

        res.status(200).json({
            success: true,
            user: userWithStats
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
};

// Impersonate user (generate token for specific user)
exports.impersonateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate impersonation token with special flag
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                isImpersonating: true,
                impersonatedBy: req.userId // Admin's user ID
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: 'Impersonation token generated',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to impersonate user',
            error: error.message
        });
    }
};

// Update user credits
exports.updateUserCredits = async (req, res) => {
    try {
        const { userId } = req.params;
        const { credits } = req.body;

        if (typeof credits !== 'number' || credits < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credits value'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.credits = credits;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User credits updated',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                credits: user.credits
            }
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to update credits',
            error: error.message
        });
    }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalResumes = await Resume.count();

        // Get users created in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newUsersToday = await User.count({
            where: {
                createdAt: {
                    [Op.gte]: oneDayAgo
                }
            }
        });

        // Get Pro users (users with more than 5 credits)
        const proUsers = await User.count({
            where: {
                credits: {
                    [Op.gt]: 5
                }
            }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                newUsersToday,
                proUsers,
                freeUsers: totalUsers - proUsers,
                totalResumes,
                revenue: 0, // TODO: Implement payment tracking
                aiCost: 0, // TODO: Implement AI cost tracking
                failedExports: 0 // TODO: Implement error tracking
            }
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};

// Get system logs
exports.getSystemLogs = async (req, res) => {
    try {
        // TODO: Implement proper logging system
        // For now, return mock logs
        const logs = [
            { id: 1, type: 'info', msg: 'System started successfully', time: new Date().toLocaleTimeString() },
            { id: 2, type: 'success', msg: 'Database connection established', time: new Date().toLocaleTimeString() }
        ];

        res.status(200).json({
            success: true,
            logs
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
}

module.exports = {
    getAllUsers: exports.getAllUsers,
    getUserById: exports.getUserById,
    impersonateUser: exports.impersonateUser,
    updateUserCredits: exports.updateUserCredits,
    getDashboardStats: exports.getDashboardStats,
    getSystemLogs: exports.getSystemLogs
};
