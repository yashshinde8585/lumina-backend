# Lumina API — Resume & Job Tracker Backend

> The REST API powering the Lumina resume platform.

Built with **Express.js** and **Sequelize**, this server handles authentication, AI-driven resume generation via Google Gemini, resume storage, file uploads, and job board persistence.

---

## Features

- **Auth** — JWT-based signup, login, and Google OAuth. Passwords hashed with bcrypt.
- **AI Generation** — Resume content generated using the `@google/generative-ai` (Gemini Pro) SDK. Rate-limited to 5 requests per minute.
- **Resume Management** — Full CRUD for resumes. Supports file import/export and Cloudinary-based image uploads.
- **Job Board Sync** — Persist and retrieve each user's Kanban job board state from the database.
- **Admin Panel** — Protected admin routes for platform management.
- **Security** — Helmet headers, CORS origin whitelisting, request compression, and structured Winston logging with daily log rotation.
- **Testing** — Jest test suite with unit and integration tests, Supertest for HTTP assertions, and coverage reporting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| ORM | Sequelize |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI | Google Gemini Pro (`@google/generative-ai`) |
| Auth | JWT + Google Auth Library |
| File Upload | Multer + Cloudinary |
| Validation | Zod |
| Logging | Winston + winston-daily-rotate-file |
| Testing | Jest + Supertest |

---

## Getting Started

### Prerequisites

- Node.js `>=18`
- A [Google Cloud](https://console.cloud.google.com/) project with the Generative Language API enabled
- (Production) A PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/yashshinde8585/backend-my-resume.git
cd backend-my-resume

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5002
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Gemini AI
GOOGLE_API_KEY=your_gemini_api_key

# Cloudinary (optional, for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Production only
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Run Locally

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start at `http://localhost:5002`.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | — | Register a new user |
| `POST` | `/login` | — | Login with email + password |
| `POST` | `/google` | — | Login with Google OAuth token |
| `GET` | `/board` | ✅ | Get the authenticated user's job board |
| `POST` | `/board` | ✅ | Save the authenticated user's job board |

### Resumes — `/api/resumes`

All routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all resumes for the current user |
| `POST` | `/` | Save a new resume |
| `GET` | `/:id` | Get a resume by ID |
| `DELETE` | `/:id` | Delete a resume |
| `POST` | `/generate` | Generate resume content with AI |
| `POST` | `/import` | Import a resume from file |
| `POST` | `/:id/upload` | Upload a file attachment to a resume |
| `GET` | `/:id/download` | Download a resume file |

### AI — `/api/generate`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/api/generate` | — | 5 req/min | Generate resume content via Gemini |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns service status |

---

## Project Structure

```
src/
├── bots/               # AI bot / prompt logic
├── config/             # Database and logger configuration
├── controllers/        # Route handlers (auth, resume, admin)
├── middleware/         # auth guard, error handler, file upload
├── models/             # Sequelize models
├── routes/             # Express routers
├── services/           # AI service (Gemini integration)
└── utils/              # Shared utilities
server.js               # App entry point
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm test` | Run all tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

---

## License

MIT
