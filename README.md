# AI Resume Generator API

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/Node-20.0.0-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-gray?logo=express)

## 📌 Project Title & Description
**AI Resume Generator API** is the robust backend service powering the AI Resume Generator platform. It provides secure authentication, data persistence, and orchestration for the Google Gemini AI integration, serving as the bridge between the frontend user experience and advanced generative models.

## ❓ Problem Statement
Frontend applications cannot securely store API keys or handle complex server-side logic like rate limiting and database transactions. A dedicated backend is required to:
1.  Securely manage Google Gemini API credentials.
2.  Persist user data (profiles, saved resumes) reliably.
3.  Handle authentication logic to protect user privacy.

## ✨ Features
- **🤖 Gemini AI Integration**: Seamlessly interfaces with Google's Generative AI to create structured resume content.
- **🔐 Stateless Authentication**: Implements secure JWT (JSON Web Token) authentication flows.
- **🛡️ Security Hardening**: Features Helmet.js for header security, CORS configuration, and Rate Limiting.
- **💾 SQLite Persistence**: Lightweight, zero-config database using Sequelize ORM.
- **✅ Input Validation**: Robust request validation using Zod schemas.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (Development/Production ready for small scale)
- **ORM**: Sequelize
- **AI Provider**: Google Generative AI SDK (`@google/generative-ai`)
- **Security**: Bcrypt, Helmet, JSONWebToken

## 📂 Project Architecture
The project follows a standard MVC (Model-View-Controller) separation of concerns.

```
Backend-my-resume/
├── src/
│   ├── config/          # Configuration files (DB, AI Client)
│   ├── controllers/     # Request handlers (Resume, Auth)
│   ├── middleware/      # Application middleware (Auth, Error Handling)
│   ├── models/          # Database definitions (User, Resume)
│   ├── routes/          # API Route definitions
│   ├── services/        # Business logic (AI generation service)
│   └── utils/           # Helper utilities and prompt templates
├── database.sqlite      # SQLite database file
└── server.js            # Application entry point
```

## 🚀 Installation & Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/Backend-my-resume.git
    cd Backend-my-resume
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5002`.

## 🔑 Environment Variables
Create a `.env` file in the root directory. **CRITICAL**: Do not check this file into version control.

```env
PORT=5002
NODE_ENV=development
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_super_secret_key_change_this_in_prod
FRONTEND_URL=http://localhost:5173
```

## 🔌 API Endpoints / Key Modules

### Authentication (`/api/auth`)
- `POST /signup`: Register a new user.
- `POST /login`: Authenticate and receive JWT.

### Resume Generation (`/api/generate`)
- `POST /`: Accepts `jd` (Job Description) and `level`, returns structured resume JSON.
    - *Rate Limited*: Max 5 requests/minute per IP.

### User Data (`/api/resumes`)
- `GET /`: Retrieve all resumes for the logged-in user.
- `POST /`: Save a new resume.

## 📸 Screenshots
*(Placeholder - API docs or Postman collection screenshots can go here)*

## 🔮 Future Enhancements
- [ ] **PostgreSQL Migration**: Move from SQLite to Postgres for production scalability.
- [ ] **Redis Caching**: Cache common AI responses to reduce API costs.
- [ ] **Social Login**: Add Google/GitHub OAuth strategies.

## ✍️ Author & Contact
**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---
*Powered by Node.js and Gemini AI.*
