const promptBuilder = (jd, level) => {
    return `
    JOB DESCRIPTION:
    "${jd}"

    EXPERIENCE LEVEL: ${level}

    INSTRUCTIONS:
    Generate a JSON resume based on the JD and structure defined in the system prompt.
    Ensure strict adherence to the level-specific constraints (Words/Lines).
    `;
};

module.exports = { promptBuilder };
