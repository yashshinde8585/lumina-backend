const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

const adminAuth = require('../middleware/adminAuth');

// All admin routes require authentication AND admin role
router.use(authMiddleware, adminAuth);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.post('/users/:userId/impersonate', adminController.impersonateUser);
router.patch('/users/:userId/credits', adminController.updateUserCredits);
router.delete('/users/:userId', adminController.deleteUser);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// System logs
router.get('/logs', adminController.getSystemLogs);

module.exports = router;
