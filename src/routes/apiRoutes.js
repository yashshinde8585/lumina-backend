const express = require('express');
const router = express.Router();

const { generate } = require('../controllers/resumeController');
const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);
router.use('/resumes', require('./resumeRoutes')); // New Resume Routes
router.post('/generate', generate);

module.exports = router;
