const express = require('express');
const router = express.Router();
console.log('✅ resumeRoutes loaded');
const checkAuth = require('../middleware/auth');
const userResumeController = require('../controllers/userResumeController');

// All routes are protected
router.use(checkAuth);

router.post('/generate', require('../controllers/resumeController').generate);
router.post('/', userResumeController.saveResume);
router.get('/', userResumeController.getResumes);
router.get('/:id', userResumeController.getResumeById);
router.delete('/:id', userResumeController.deleteResume);

module.exports = router;
