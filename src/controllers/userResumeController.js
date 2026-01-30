const { Resume } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');


exports.saveResume = async (req, res) => {

    try {
        const { title, content, template } = req.body;
        const userId = req.userData.userId; // From auth middleware


        if (!content) {

            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Resume content is required' });
        }

        const newResume = await Resume.create({
            userId,
            title: title || 'Untitled Resume',
            content,
            template: template || 'modern'
        });


        res.status(HTTP_STATUS.CREATED).json({ message: 'Resume saved successfully', resume: newResume });
    } catch (error) {

        if (error.name === 'SequelizeValidationError') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        logger.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to save resume', error: error.message });
    }
};

exports.getResumes = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const resumes = await Resume.findAll({
            where: { userId },
            attributes: ['id', 'title', 'template', 'content', 'updatedAt', 'createdAt', 'fileUrl', 'publicId'],
            order: [['createdAt', 'DESC']]
        });
        res.json(resumes);
    } catch (error) {
        logger.error(error);
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
        logger.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch resume', error: error.message });
    }
};

exports.deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const resume = await Resume.findOne({ where: { id, userId } });

        if (!resume) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        // Delete from Cloudinary if publicId exists
        if (resume.publicId) {
            try {
                // Determine resource type: 'raw' for PDFs, 'image' for others
                const isPdf = resume.fileUrl && resume.fileUrl.toLowerCase().includes('.pdf');
                await cloudinary.uploader.destroy(resume.publicId, {
                    resource_type: isPdf ? 'raw' : 'image'
                });
            } catch (clErr) {
                console.error("Cloudinary delete error:", clErr);
            }
        }

        await resume.destroy();
        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Failed to delete resume', error: error.message });
    }
};

const https = require('https');

exports.downloadResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const resume = await Resume.findOne({ where: { id, userId } });

        if (!resume || !resume.fileUrl) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume file not found' });
        }

        // Proxy the download
        const filename = `${resume.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        https.get(resume.fileUrl, (stream) => {
            stream.pipe(res);
        }).on('error', (err) => {

            res.status(500).json({ message: 'Failed to stream file' });
        });

    } catch (error) {
        logger.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Download failed', error: error.message });
    }
};

exports.uploadResumeFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        const resume = await Resume.findOne({ where: { id, userId } });
        if (!resume) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        // Upload to Cloudinary using stream
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const isPdf = req.file.mimetype === 'application/pdf';
                // Sanitize filename: remove special chars, spaces to underscores to avoid URL issues
                const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `resumes/${userId}`,
                        resource_type: isPdf ? 'raw' : 'auto',
                        // For raw files, include extension in public_id manually from original name (sanitized)
                        public_id: isPdf ? sanitizedFileName : undefined,
                        type: 'upload', // Explicitly public
                        access_mode: 'public' // Explicitly public
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.write(buffer);
                stream.end();
            });
        };

        const result = await streamUpload(req.file.buffer);

        // Update DB
        resume.fileUrl = result.secure_url;
        resume.publicId = result.public_id;
        await resume.save();


        res.json({
            message: 'File uploaded successfully',
            fileUrl: resume.fileUrl,
            publicId: resume.publicId
        });

    } catch (error) {
        logger.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Upload failed', error: error.message });
    }
};

exports.importResume = async (req, res) => {
    try {
        const userId = req.userData.userId;

        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        // Debug Cloudinary Config
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {

            return res.status(500).json({ message: 'Server misconfiguration: Cloudinary credentials missing' });
        }



        // Upload to Cloudinary using stream
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const isPdf = req.file.mimetype === 'application/pdf';
                // Sanitize filename: remove special chars, spaces to underscores to avoid URL issues
                const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `resumes/${userId}`,
                        resource_type: isPdf ? 'raw' : 'auto',
                        // For raw files, include extension in public_id manually from original name (sanitized)
                        public_id: isPdf ? sanitizedFileName : undefined,
                        type: 'upload', // Explicitly public
                        access_mode: 'public' // Explicitly public
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.write(buffer);
                stream.end();
            });
        };

        const result = await streamUpload(req.file.buffer);

        // Create new Resume Record
        const newResume = await Resume.create({
            userId,
            title: req.body.title || 'Imported Resume',
            content: {}, // Empty content for now, or placeholder
            template: 'imported', // Special template type to indicate it's a file
            fileUrl: result.secure_url,
            publicId: result.public_id
        });


        res.status(HTTP_STATUS.CREATED).json({
            message: 'Resume imported successfully',
            resume: newResume
        });

    } catch (error) {
        logger.error(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Import failed', error: error.message });
    }
};
