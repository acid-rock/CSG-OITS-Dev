# backend

Express 5 REST API for CSG-OITS. Serves all data to the public frontend and the authenticated admin panel.

## Overview

The backend is a Node.js ESM application using Express 5. It connects to Supabase for the database, authentication, and file storage. All routes are under `/api/v1`. The server uses `src/server.js` as the entry point, which imports the Express app from `src/app.js`.

There is no TypeScript in the backend — pure JavaScript ESM with JSDoc type hints.

## Running locally

```bash
# Install dependencies
npm install

# Copy and fill the environment file
cp .env.example .env

# Start in development (nodemon auto-restart)
npm run dev     # https://localhost:3000

# Start in production
npm start       # node src/server.js

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

**Port:** `PORT` env var (default: 3000)

## HTTPS requirement

The backend sets `sb_access_token` with `secure: true`. Browsers refuse to store or send secure cookies over plain HTTP. Local development requires HTTPS via **mkcert** — see [docs/local-setup.md](../docs/local-setup.md) Step 3.

## Environment variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Anon/public key — for public reads (RLS enforced) |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key — for admin writes (bypasses RLS) |
| `SUPABASE_JWT_SECRET` | Yes | Used by `requireAuth` to verify JWTs |
| `SUPABASE_PROJECT_REF` | Yes | Supabase project ref (for Management API) |
| `SUPABASE_MANAGEMENT_TOKEN` | Yes | For storage analytics endpoint |
| `PDF_REDACT_URL` | Yes | URL of the PDF redaction microservice |
| `FRONTEND_URL` | Yes | Allowed CORS origin (e.g., `https://localhost:5173`) |
| `PORT` | No | HTTP port (default: 3000) |
| `NODE_ENV` | No | Set to `production` to suppress error stack traces |

## Directory structure

| Path | Purpose |
|---|---|
| `src/app.js` | Express app: middleware setup, route registration, global error handler |
| `src/server.js` | HTTP server entry point (`app.listen`) |
| `src/lib/` | Shared utilities (Supabase clients, cache, error class, sanitize, upload validation) |
| `src/middlewares/` | `requireAuth`, `validate`, `auditLogger` |
| `src/routes/` | One route file per resource |
| `src/schemas/` | Zod validation schemas used by `validate()` middleware |
| `tests/` | Vitest unit and route tests — never hit the real database |

## Related docs

- [docs/architecture.md](../docs/architecture.md) — system diagram, request flows
- [docs/api-reference.md](../docs/api-reference.md) — every endpoint documented
- [docs/local-setup.md](../docs/local-setup.md) — full setup guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) — critical backend rules (ESM, ApiError, client selection)
