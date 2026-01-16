const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);

router.get('/board', auth, authController.getBoard);
router.post('/board', auth, authController.updateBoard);

module.exports = router;
