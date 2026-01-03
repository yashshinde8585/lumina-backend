const { Resume } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

exports.saveResume = async (req, res) => {
    console.log('📝 [DEBUG] Attempting to save resume...');
    try {
        const { title, content, template } = req.body;
        const userId = req.userData.userId; // From auth middleware
        console.log(`👤 [DEBUG] User ID: ${userId}`);
        console.log(`📄 [DEBUG] Resume Data:`, { title, template, contentExists: !!content });

        if (!content) {
            console.warn('⚠️ [DEBUG] Missing content in request body');
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Resume content is required' });
        }

        const newResume = await Resume.create({
            userId,
            title: title || 'Untitled Resume',
            content,
            template: template || 'modern'
        });

        console.log(`✅ [DEBUG] Resume saved successfully. ID: ${newResume.id}`);
        res.status(HTTP_STATUS.CREATED).json({ message: 'Resume saved successfully', resume: newResume });
    } catch (error) {
        console.error('❌ [DEBUG] Save Resume Error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to save resume', error: error.message });
    }
};

exports.getResumes = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const resumes = await Resume.findAll({
            where: { userId },
            attributes: ['id', 'title', 'template', 'updatedAt', 'createdAt'], // Optimization: Don't fetch heavy 'content' JSON
            order: [['createdAt', 'DESC']]
        });
        res.json(resumes);
    } catch (error) {
        console.error('Get Resumes Error:', error);
        res.status(500).json({ message: 'Failed to fetch resumes', error: error.message });
    }
};

exports.getResumeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const resume = await Resume.findOne({ where: { id, userId } });

        if (!resume) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        res.json(resume);
    } catch (error) {
        console.error('Get Resume Error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch resume', error: error.message });
    }
};

exports.deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const deleted = await Resume.destroy({ where: { id, userId } });

        if (!deleted) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found or unauthorized' });
        }

        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Delete Resume Error:', error);
        res.status(500).json({ message: 'Failed to delete resume', error: error.message });
    }
};
