const { RESUME_LEVELS } = require('./constants');

const buildSystemInstruction = (level, rule) => `
    You are an expert Resume Builder AI. Your task is to generate a professional, ATS-friendly resume JSON based on the user's Job Description (JD) and Experience Level.
    
    Target Structure:
{
    "personalInfo": { "fullName": "John Doe", "email": "john@example.com", "phone": "123-456-7890", "linkedin": "linkedin.com/in/johndoe", "links": ["github.com/johndoe"] },
    "summary": "Professional summary...",
        "skills": ["Skill 1", "Skill 2"],
            "experience": [{ "title": "Role", "company": "Company", "duration": "Dates", "description": "Bullet points..." }],
                "projects": [{ "name": "Project", "tech": "Stack", "description": "Details..." }],
                    "education": [{ "school": "Uni", "degree": "Degree", "year": "2020" }],
                        "certifications": [{ "name": "Cert Name", "issuer": "Issuer", "year": "2023" }]
}

Rules:
1. Analyze the JD keywords carefully. Matches are critical.
2. Experience Level: ${level || RESUME_LEVELS.ENTRY_LEVEL}
- Strategy: ${rule.strategy}
- Length Constraint: ${rule.constraint} (${rule.wordCount})
- Logical Flow: ${rule.structure}
- What to Cut(Exclude): ${rule.cut}
- Formatting: Use standard bullet points. Avoid orphans (single words on new lines).

    STRICT Section Limits (Must Follow):
    - Summary: ${rule.limits?.summary || 'Concise'}
    - Skills: ${rule.limits?.skills || 'Relevant'}
    - Experience: ${rule.limits?.experience || 'Standard'}
    - Projects: ${rule.limits?.projects || 'Standard'}
    - Education: ${rule.limits?.education || 'Standard'}

6. NO markdown in JSON values (except basic bullets if needed).
    7. Return ONLY valid JSON.
    8. IMPORTANT: Output must be MINIFIED (single line). Remove all control characters. Escape newlines in strings as \\n.
    `;

const FALLBACK_RESUME = {
    personalInfo: {
        fullName: "Fallback User",
        email: "user@example.com",
        phone: "123-456-7890",
        linkedin: "linkedin.com/in/fallback",
        links: ["github.com/fallback"]
    },
    summary: "This is a fallback resume because the AI service encountered an error (e.g., Model not found or Quota exceeded). Please check your API key or try again later.",
    skills: ["JavaScript", "React", "Node.js", "Resilience Patterns", "Error Handling"],
    experience: [
        {
            title: "Software Engineer",
            company: "Tech Corp",
            duration: "2022 - Present",
            description: "Implemented robust error handling and fallback mechanisms to ensure 100% system uptime."
        },
        {
            title: "Junior Developer",
            company: "Startup Inc",
            duration: "2020 - 2022",
            description: "Built responsive frontend interfaces using React and Tailwind CSS."
        }
    ],
    projects: [
        {
            name: "Resume Builder",
            tech: "MERN Stack",
            description: "A resilient resume generator that works even when external APIs fail."
        }
    ],
    education: [
        {
            school: "Tech University",
            degree: "B.S. Computer Science",
            year: "2020"
        }
    ],
    certifications: []
};

module.exports = { buildSystemInstruction, FALLBACK_RESUME };
