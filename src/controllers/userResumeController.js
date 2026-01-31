const { Resume } = require('../models');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const fs = require('fs');
const https = require('https');

exports.saveResume = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { title, content, template } = req.body;
        const userId = req.userData.userId;

        if (!content) {
            await t.rollback();
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Resume content is required' });
        }

        const newResume = await Resume.create({
            userId,
            title: title || 'Untitled Resume',
            content,
            template: template || 'modern'
        }, { transaction: t });

        await t.commit();
        res.status(HTTP_STATUS.CREATED).json({ message: 'Resume saved successfully', resume: newResume });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

exports.getResumes = async (req, res, next) => {
    try {
        const userId = req.userData.userId;
        const resumes = await Resume.findAll({
            where: { userId },
            attributes: ['id', 'title', 'template', 'content', 'updatedAt', 'createdAt', 'fileUrl', 'publicId'],
            order: [['createdAt', 'DESC']]
        });
        res.json(resumes);
    } catch (error) {
        next(error);
    }
};

exports.getResumeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const resume = await Resume.findOne({ where: { id, userId } });

        if (!resume) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        res.json(resume);
    } catch (error) {
        next(error);
    }
};

exports.deleteResume = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        const resume = await Resume.findOne({ where: { id, userId }, transaction: t });

        if (!resume) {
            await t.rollback();
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        // Delete from Cloudinary if publicId exists
        if (resume.publicId) {
            try {
                const isPdf = resume.fileUrl && resume.fileUrl.toLowerCase().includes('.pdf');
                await cloudinary.uploader.destroy(resume.publicId, {
                    resource_type: isPdf ? 'raw' : 'image'
                });
            } catch (clErr) {
                logger.error("Cloudinary delete error (Non-fatal):", clErr);
            }
        }

        await resume.destroy({ transaction: t });
        await t.commit();
        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.downloadResume = async (req, res, next) => {
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
            next(err);
        });

    } catch (error) {
        next(error);
    }
};

exports.uploadResumeFile = async (req, res, next) => {
    const t = await sequelize.transaction();
    let uploadedPublicId = null;

    try {
        const { id } = req.params;
        const userId = req.userData.userId;

        if (!req.file) {
            await t.rollback();
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        const resume = await Resume.findOne({ where: { id, userId }, transaction: t });
        if (!resume) {
            // Clean up local file since request failed
            if (req.file.path) fs.unlink(req.file.path, () => { });
            await t.rollback();
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Resume not found' });
        }

        // Upload to Cloudinary using Stream (from File on Disk now)
        const uploadToCloudinary = (filePath) => {
            return new Promise((resolve, reject) => {
                const isPdf = req.file.mimetype === 'application/pdf';
                const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `resumes/${userId}`,
                        resource_type: isPdf ? 'raw' : 'auto',
                        public_id: isPdf ? sanitizedFileName : undefined,
                        type: 'upload',
                        access_mode: 'public'
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );

                fs.createReadStream(filePath).pipe(stream);
            });
        };

        const result = await uploadToCloudinary(req.file.path);
        uploadedPublicId = result.public_id; // Track for ghost cleanup

        // Cleanup local temp file immediately after upload to Cloudinary
        fs.unlink(req.file.path, (err) => {
            if (err) logger.warn("Failed to delete temp file:", err);
        });

        // Update DB
        const oldPublicId = resume.publicId; // Track old one to delete
        resume.fileUrl = result.secure_url;
        resume.publicId = result.public_id;
        await resume.save({ transaction: t });

        await t.commit();

        // Cleanup OLD file from Cloudinary (Post-commit)
        if (oldPublicId && oldPublicId !== result.public_id) {
            cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(e => logger.warn("Failed to delete old resume file", e));
        }

        res.json({
            message: 'File uploaded successfully',
            fileUrl: resume.fileUrl,
            publicId: resume.publicId
        });

    } catch (error) {
        await t.rollback();
        // Ghost File Cleanup: If DB updated failed, delete the Orphan file from Cloudinary
        if (uploadedPublicId) {
            cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'raw' }).catch(e => logger.warn("Ghost cleanup failed", e));
        }
        // Cleanup local file if it still exists
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        next(error);
    }
};

exports.importResume = async (req, res, next) => {
    const t = await sequelize.transaction();
    let uploadedPublicId = null;

    try {
        const userId = req.userData.userId;

        if (!req.file) {
            await t.rollback();
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });
        }

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            // Clean local
            if (req.file.path) fs.unlink(req.file.path, () => { });
            await t.rollback();
            return res.status(500).json({ message: 'Server misconfiguration: Cloudinary credentials missing' });
        }

        // Upload to Cloudinary using Stream (from Disk)
        const uploadToCloudinary = (filePath) => {
            return new Promise((resolve, reject) => {
                const isPdf = req.file.mimetype === 'application/pdf';
                const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `resumes/${userId}`,
                        resource_type: isPdf ? 'raw' : 'auto',
                        public_id: isPdf ? sanitizedFileName : undefined,
                        type: 'upload',
                        access_mode: 'public'
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                fs.createReadStream(filePath).pipe(stream);
            });
        };

        const result = await uploadToCloudinary(req.file.path);
        uploadedPublicId = result.public_id;

        // Cleanup local temp file
        fs.unlink(req.file.path, (err) => {
            if (err) logger.warn("Failed to delete temp file:", err);
        });

        // Create new Resume Record
        const newResume = await Resume.create({
            userId,
            title: req.body.title || 'Imported Resume',
            content: {},
            template: 'imported',
            fileUrl: result.secure_url,
            publicId: result.public_id
        }, { transaction: t });

        await t.commit();

        res.status(HTTP_STATUS.CREATED).json({
            message: 'Resume imported successfully',
            resume: newResume
        });

    } catch (error) {
        await t.rollback();
        // Ghost File Cleanup
        if (uploadedPublicId) {
            cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'raw' }).catch(e => logger.warn("Ghost cleanup failed", e));
        }
        // Cleanup local file
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        next(error);
    }
};
