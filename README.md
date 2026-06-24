# IT Hub Backend

A TypeScript-based Express API backend for the IT Hub E-Learning platform. This service provides user authentication, course management, file uploads, progress tracking, AI-powered features, and integration with PostgreSQL, Redis, and optional Cloudinary storage.

> Frontend repository: https://github.com/nguyenhbtrung/it-hub-frontend

## Why this project is useful

- Built for online learning platforms with course/section/unit/step management
- Supports user registration, login, email verification, password reset, and JWT authentication
- Includes enrollment tracking, instructor dashboards, and student progress monitoring
- Handles file upload, streaming, signed uploads, and thumbnail serving
- Integrates with AI services (Google Gemini, Cohere, LangChain) for advanced content workflows
- Uses Prisma ORM for PostgreSQL and Redis for caching and refresh-token state

## Key features

- Authentication: JWT-based login, refresh tokens, logout, email verification
- Course management: categories, courses, sections, units, steps, and exercises
- Enrollment and progress tracking for students and instructors
- File management: upload, stream, serve, URL generation, Cloudinary support
- AI endpoints: content processing and intelligent recommendations
- Health and diagnostics: `/ping` and `/health`

## Getting started

### Prerequisites

- Node.js 20+ (recommended)
- npm
- PostgreSQL database
- Redis instance
- Optional: Cloudinary account for remote file storage

### Install dependencies

```bash
npm install
```

### Configure environment

Copy the sample environment file and update the values for your environment:

```bash
cp .env.example .env
```

Required values include:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `FRONTEND_URL`
- `GEMINI_API_KEY`
- `COHERE_API_KEY`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_USERNAME`

Optional values:

- `FILE_PROVIDER` (`local` or `cloudinary`)
- `UPLOAD_DIR`
- `ASSET_BASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Generate Prisma client

```bash
npm run prisma:generate
```

### Run database migrations

```bash
npm run prisma:migrate
```

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm start
```

## Usage examples

Start the server and use the API under `/api`.

Example login request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

Example course fetch:

```bash
curl http://localhost:3000/api/courses
```

Example file upload (authenticated):

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./path/to/file.mp4"
```

## Important routes

- `/health` - Health check
- `/ping` - Ping endpoint
- `/api/auth` - Authentication and account flows
- `/api/courses` - Course operations
- `/api/categories` - Category listing
- `/api/enrollments` - Enrollment operations
- `/api/files` - File upload and serving
- `/api/dashboard` - Instructor/admin dashboards
- `/api/users` - User profile and management
- `/api/ai` - AI earning assistant

For complete route details, inspect `src/routes`.

## Project structure

- `src/index.ts` - Application entrypoint
- `src/routes` - Express route definitions
- `src/controllers` - Request handlers
- `src/services` - Business logic and integrations
- `src/repositories` - Data access layer and database queries
- `src/config` - Passport, upload, and Cloudinary setup
- `src/infra` - Redis, cache, and persistence helpers
- `src/lib/prisma.ts` - Prisma client setup

## Commands

- `npm run dev` - Start with `nodemon`
- `npm run build` - Compile TypeScript and apply path aliases
- `npm start` - Run built production code
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run prettier` - Check formatting
- `npm run prettier:fix` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Apply database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run migration:files` - Migrate existing files from local server to Cloudinary

## Help and contribution

Contributions are welcome via issues and pull requests. If this repository includes a `CONTRIBUTING.md`, please follow that guide for contributions.

If you need help:

- Check the source in `src/`
- Use the issue tracker in this repository

## License

This project is licensed as `ISC` as defined in `package.json`.
