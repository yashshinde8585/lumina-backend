const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

const RESUME_LEVELS = {
    STUDENT: 'Student',
    ENTRY_LEVEL: 'Entry-Level',
    MID_LEVEL: 'Mid-Level',
    SENIOR: 'Senior'
};

const TEMPLATES = {
    MODERN: 'modern',
    COMPACT: 'compact',
    CREATIVE: 'creative',
    TECH: 'tech'
};

const AI_MODELS = {
    GEMINI_PRO: 'gemini-pro'
};

const ERROR_MESSAGES = {
    GENERIC: 'Something went wrong. Please try again.',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication failed',
    INVALID_INPUT: 'Invalid input provided',
    AI_QUOTA_EXCEEDED: 'Usage limit exceeded. Please check your Google Gemini quota.',
    AI_MODEL_NOT_FOUND: 'Model not found. Check Google API availability.',
    AI_SAFETY_BLOCK: 'Generation blocked by safety settings.',
    AI_FORMAT_ERROR: 'AI Generation Format Error. The AI returned invalid data.'
};

const RESUME_RULES = {
    'Student': {
        constraint: '1 Page (Strict)',
        wordCount: '250-400 words',
        strategy: 'Selling Potential & Education. Since work history is short, Education and Projects must do the heavy lifting.',
        structure: 'Education (Top): Include GPA, Coursework, Awards. Experience: Internships or "Academic Projects" formatted as jobs. Skills: List every tool learned.',
        cut: 'High school details.',
        limits: {
            summary: '20-30 Words (Max 2 Lines)',
            skills: '15-20 Keywords (Max 3 Lines)',
            experience: '~150 Words Total',
            projects: '~150 Words (2-3 Projects)',
            education: '40-50 Words (4 Lines)',
            certifications: '20 Words (2 Lines)'
        }
    },
    'Entry-Level': {
        constraint: '1 Page (Strict)',
        wordCount: '350-500 words',
        strategy: 'Selling Competence & Hard Skills. Prove you are "work-ready". Transition from "learning" to "doing".',
        structure: 'Experience (Top): Internships, Freelance, Open Source. Action verbs. Education: Move to Bottom.',
        cut: 'Part-time non-tech jobs (retail/server).',
        limits: {
            summary: '30-40 Words (Max 3 Lines)',
            skills: '15-20 Keywords (Max 3 Lines)',
            experience: '~250 Words Total',
            projects: '~100 Words (1-2 Projects)',
            education: '30 Words (2 Lines)',
            certifications: '20 Words (2 Lines)'
        }
    },
    'Mid-Level': {
        constraint: '1 to 2 Pages',
        wordCount: '500-800 words',
        strategy: 'Selling Impact & Metrics. Recruiters know you can code; show how well you do it (Metrics/Scale).',
        structure: 'Summary: 2-3 line professional niche summary. Experience: Focus on Metrics (latency, scale, revenue). Skills: Group logically (Frontend, Backend).',
        cut: 'GPA, college clubs, graduation year.'
    },
    'Senior': {
        constraint: '2 Pages Max',
        wordCount: '800-1200 words',
        strategy: 'Selling Leadership & Expertise. You are a problem solver and mentor. Show business value.',
        structure: 'Experience: Detailed bullets for last 5-7 years. Compress older jobs. Focus on Mentorship & Architecture. Education: Minimal at bottom.',
        cut: 'Legacy technical skills no longer used.'
    }
};

module.exports = {
    HTTP_STATUS,
    RESUME_LEVELS,
    TEMPLATES,
    AI_MODELS,
    ERROR_MESSAGES,
    RESUME_RULES
};
