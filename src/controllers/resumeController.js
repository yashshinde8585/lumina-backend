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
        if (error.message && (
            error.message.includes("404") ||
            error.message.includes("429") ||
            error.message.includes("SAFETY") ||
            error.message.includes("Validation Failed")
        )) {
            // Keep specific AI error mapping if useful, or just pass it
            // For now, let's allow the global handler to log it, but if we want specific status codes:
            let errorMessage = error.message;
            if (errorMessage.includes("404")) errorMessage = ERROR_MESSAGES.AI_MODEL_NOT_FOUND;
            else if (errorMessage.includes("429")) errorMessage = ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
            else if (errorMessage.includes("SAFETY")) errorMessage = ERROR_MESSAGES.AI_SAFETY_BLOCK;
            else if (errorMessage.includes("Validation")) return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({ error: ERROR_MESSAGES.AI_FORMAT_ERROR, details: error.message });

            // Pass mapped error with custom status if needed, or just next(error)
            // Error handler defaults to 500, but we might want 503 for quota etc.
            // For simplicity and standardization as requested:
            return next(new Error(errorMessage));
        }
        next(error);
    }
};

module.exports = { generate };
