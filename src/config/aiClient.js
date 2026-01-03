
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GOOGLE_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
    : {
        getGenerativeModel: () => ({
            generateContent: async () => ({
                response: {
                    text: () => JSON.stringify({
                        personalInfo: { fullName: "Mock User", email: "mock@example.com", links: [] },
                        summary: "This is a mock resume generated because user disabled Google API.",
                        skills: ["Mock Skill A", "Mock Skill B"],
                        experience: [{ title: "Mock Role", company: "Mock Co", duration: "2023", description: "Mock description" }],
                        projects: [],
                        education: [],
                        certifications: []
                    })
                }
            })
        })
    };

if (!process.env.GOOGLE_API_KEY) {
    console.warn("⚠️  GOOGLE_API_KEY is missing. Returning MOCK RESUME data.");
}

module.exports = genAI;
