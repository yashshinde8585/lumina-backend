const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// All admin routes require authentication
// TODO: Add admin role check middleware

// Dashboard stats
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// User management
router.get('/users', authMiddleware, adminController.getAllUsers);
router.get('/users/:userId', authMiddleware, adminController.getUserById);
router.post('/users/:userId/impersonate', authMiddleware, adminController.impersonateUser);
router.patch('/users/:userId/credits', authMiddleware, adminController.updateUserCredits);

// System logs
router.get('/logs', authMiddleware, adminController.getSystemLogs);

module.exports = router;
