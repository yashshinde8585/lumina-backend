# 🧠 AI Resume Generator - Backend

A robust, Node.js & Express-based backend serving the AI Resume Generator application. It leverages **Google Gemini 2.0 Flash** (via `gemini-flash-latest`) to generate structured, ATS-friendly resumes from Job Descriptions.

## 🚀 Features
*   **AI-Powered Generation**: Converts raw Job Descriptions into professional JSON resumes.
*   **Smart Prompt Engineering**: Tailors content based on experience level ("Fresher" vs "Experienced").
*   **Robust Error Handling**: Gracefully handles API quotas (429) and model availability (404).
*   **Secure & Modular**: Built with `helmet` for security and a clean generic controller-service architecture.

## 🛠️ Tech Stack
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **AI Provider**: Google Generative AI (Gemini)
*   **Utilities**: `Brakeman`, `dotenv`, `cors`

## 📂 Project Structure
```bash
Backend-my-resume/
├── config/
│   └── aiClient.js        # Gemini Client Setup
├── controllers/
│   └── resumeController.js # Request Validation & Error Handling
├── services/
│   └── aiService.js       # AI Logic & Response Parsing
├── utils/
│   └── promptBuilder.js   # Dynamic Prompt Generation
├── routes/
│   └── apiRoutes.js       # API Endpoints
├── server.js              # Entry Point
└── .env                   # Environment Variables
```

## 🔧 Setup & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    Create a `.env` file in the root:
    ```env
    PORT=5000
    GOOGLE_API_KEY=your_google_ai_studio_key
    ```

3.  **Start Server**
    ```bash
    npm start
    ```
    *   Server runs on `http://localhost:5000`
    *   Health Check: `GET /`

## 🔌 API Endpoints

### `POST /api/generate`
Generates a resume based on a Job Description.

**Request Body:**
```json
{
  "jd": "We are looking for a Senior React Developer...",
  "level": "Experienced" // or "Fresher", "Student"
}
```

**Response:**
Returns a JSON object matching the Frontend Schema (PersonalInfo, Experience, Skills, Projects, Education, Certifications).

## ⚠️ Troubleshooting
*   **404 Model Not Found**: Ensure your API Key is from **Google AI Studio** and the API is enabled in your Google Cloud Project.
*   **429 Too Many Requests**: You have hit the free tier quota. Wait a few seconds and try again.
