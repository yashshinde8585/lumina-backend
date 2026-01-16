const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/auth');
const userResumeController = require('../controllers/userResumeController');

const upload = require('../middleware/upload');

// All routes are protected
router.use(checkAuth);

// Import Route (Must be before generic /:id routes if they existed, though here methods differ)
router.post('/import', upload.single('file'), userResumeController.importResume);

router.post('/generate', require('../controllers/resumeController').generate);
router.post('/', userResumeController.saveResume);
router.get('/', userResumeController.getResumes);
router.post('/:id/upload', upload.single('file'), userResumeController.uploadResumeFile);
router.get('/:id/download', userResumeController.downloadResume);
router.get('/:id', userResumeController.getResumeById);
router.delete('/:id', userResumeController.deleteResume);

module.exports = router;
