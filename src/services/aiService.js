const { z } = require('zod');
const genAI = require('../config/aiClient');
const { promptBuilder } = require('../utils/promptBuilder');
const { RESUME_RULES, AI_MODELS, RESUME_LEVELS } = require('../utils/constants');

const { buildSystemInstruction, FALLBACK_RESUME } = require('../utils/aiTemplates');

const generateResume = async (jd, level, template) => {
    const rules = RESUME_RULES;
    const currentRule = rules[level] || rules[RESUME_LEVELS.ENTRY_LEVEL];

    const systemInstruction = buildSystemInstruction(level, currentRule);

    // Append template instruction (still dynamic enough to keep here or move if needed, keeping here for now as it's small)
    const templateInstruction = `
    3. Template Style: ${template === 'compact' ? 'Concise/Single Page' : 'Detailed'}.
       ${template === 'compact'
            ? '- STRICTLY limit "summary" to 2 sentences.\n       - Limit "experience" descriptions to 2-3 high-impact bullet points maximum.'
            : '- Provide detailed "experience" descriptions (4-5 bullets) with metrics.'
        }
    `;

    try {


        const prompt = promptBuilder(jd, level);
        const model = genAI.getGenerativeModel({
            model: AI_MODELS.GEMINI_PRO,
            generationConfig: { responseMimeType: "application/json" }
        });

        const fullPrompt = `${systemInstruction}\n${templateInstruction}\n\n${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseContent = response.text();



        let parsed;
        try {
            parsed = JSON.parse(responseContent);
        } catch (e) {

            let text = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstCurly = text.indexOf('{');
            const lastCurly = text.lastIndexOf('}');
            if (firstCurly !== -1 && lastCurly !== -1) {
                text = text.substring(firstCurly, lastCurly + 1);
            }
            parsed = JSON.parse(text);
        }

        // Zod Schema Validation
        const ResumeSchema = z.object({
            personalInfo: z.object({
                fullName: z.string(),
                email: z.string().optional().nullable(),
                phone: z.string().optional().nullable(),
                linkedin: z.string().optional().nullable().or(z.literal("")),
                links: z.array(z.string()).optional().nullable()
            }),
            summary: z.string(),
            skills: z.array(z.string()),
            experience: z.array(z.object({
                title: z.string(),
                company: z.string(),
                duration: z.string(),
                description: z.string()
            })).optional().nullable(),
            projects: z.array(z.object({
                name: z.string(),
                tech: z.string(),
                description: z.string()
            })).optional().nullable(),
            education: z.array(z.object({
                school: z.string(),
                degree: z.string(),
                year: z.string()
            })).optional().nullable(),
            certifications: z.array(z.object({
                name: z.string(),
                issuer: z.string(),
                year: z.string()
            })).optional().nullable()
        });

        const validatedData = ResumeSchema.parse(parsed);

        // Normalize nulls to empty arrays/strings for frontend safety
        if (!validatedData.personalInfo.links) validatedData.personalInfo.links = [];
        if (!validatedData.experience) validatedData.experience = [];
        if (!validatedData.projects) validatedData.projects = [];
        if (!validatedData.education) validatedData.education = [];
        if (!validatedData.certifications) validatedData.certifications = [];

        return validatedData;

    } catch (error) {

        return FALLBACK_RESUME;
    }
};

module.exports = { generateResume };
