const { generateResume } = require('../services/aiService');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const logger = require('../config/logger');

const generate = async (req, res) => {
    const { jd, level } = req.body;

    // Basic Validation
    if (!jd || jd.length < 50) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Job Description is too short or missing." });
    }

    try {
        const resumeData = await generateResume(jd, level);
        res.json(resumeData);
    } catch (error) {
        logger.error(error);
        let errorMessage = error.message || "Failed to generate resume.";

        if (errorMessage.includes("404") && errorMessage.includes("not found")) {
            errorMessage = ERROR_MESSAGES.AI_MODEL_NOT_FOUND;
        } else if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("exhausted")) {
            errorMessage = ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
        } else if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
            errorMessage = ERROR_MESSAGES.AI_SAFETY_BLOCK;
        } else if (errorMessage.includes("Validation Failed") || errorMessage.includes("JSON")) {
            errorMessage = ERROR_MESSAGES.AI_FORMAT_ERROR;
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({ error: errorMessage, details: error.message });
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: errorMessage });
    }
};

module.exports = { generate };
