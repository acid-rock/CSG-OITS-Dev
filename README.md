# CSG-OITS — Online Information Transparency System

CSG-OITS is the official digital transparency platform for the Central Student Government of Cavite State University – Imus Campus. It gives every student on-campus read-only access to CSG announcements, documents, events, officer rosters, and equipment borrowing — while giving CSG administrators a private panel to manage all content without touching a database.

![Status](https://img.shields.io/badge/status-active-success)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Express%205-blue)
![DB](https://img.shields.io/badge/database-Supabase-3ecf8e)

---

## What is OITS?

From a student's perspective, OITS is a simple website: open it in a browser, no login required, and you can read all CSG announcements, download official documents, see upcoming and past events, browse officer profiles, view affiliated student organizations, and submit equipment borrow requests. Everything is filtered by academic term so older records stay available without cluttering the current view.

From a CSG admin's perspective, OITS is a full content management panel. After logging in with a CSG-issued account, an admin can draft and publish announcements (with images), upload and redact official PDF documents, add event photo galleries, manage officer and committee rosters, track equipment borrow requests, view the system audit trail, and configure term settings — all without writing SQL or touching Supabase directly.

---

## Two audiences

| Audience          | Access                 | What they can do                                                                                                                                 |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Students (public) | No login required      | Read announcements, download documents, browse events, view officer profiles and committees, see organizations, submit equipment borrow requests |
| CSG Admins        | Email + password login | Full CRUD on all content; archive and bin management; equipment inventory; borrow request approval; audit log; system settings                   |

---

## Live features

| Feature                                 | Status         | Notes                                                                |
| --------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Public homepage (hero, stats, sections) | ✅ IMPLEMENTED |                                                                      |
| Announcements page (`/bulletin`)        | ✅ IMPLEMENTED | Search, category filter, term filter, pinned hero card               |
| Documents page (`/documents`)           | ✅ IMPLEMENTED | PDF viewer, sidebar category filter — approved design, do not modify |
| Events page (`/events`)                 | ✅ IMPLEMENTED | Image carousel modal, pagination                                     |
| Officers page (`/officers`)             | ✅ IMPLEMENTED | President highlight, committees modal, search/term filter            |
| About page (`/about`)                   | ✅ IMPLEMENTED | Live stats (officers, documents, organizations)                      |
| Equipment borrow form (`/borrow`)       | ✅ IMPLEMENTED | Multi-item borrow form, inventory grid, fallback inventory           |
| Contributors page (`/contributors`)     | ✅ IMPLEMENTED | Team list with officer avatar lookup                                 |
| Admin login / forgot / reset password   | ✅ IMPLEMENTED | Supabase Auth, httpOnly cookies                                      |
| Admin dashboard                         | ✅ IMPLEMENTED | Stats cards, bar chart, recent audit activity                        |
| Admin announcements panel               | ✅ IMPLEMENTED | Archive / Bin / Pin system, category filter                          |
| Admin documents panel                   | ✅ IMPLEMENTED | PDF upload + redaction via microservice, thumbnail generation        |
| Admin events panel                      | ✅ IMPLEMENTED | Up to 3 images per event, date filter                                |
| Admin officers panel                    | ✅ IMPLEMENTED | Avatar upload, committee assignment, type filter                     |
| Admin committees panel                  | ✅ IMPLEMENTED | Inline rename, bulk archive                                          |
| Admin organizations panel               | ✅ IMPLEMENTED | Logo upload, Facebook link                                           |
| Admin equipment borrowing panel         | ✅ IMPLEMENTED | Approve / Reject / Return workflow + inventory CRUD                  |
| Admin audit log panel                   | ✅ IMPLEMENTED | All write operations logged with user, IP, timestamp                 |
| Admin settings panel                    | ✅ IMPLEMENTED | Active term, account list, password change, changelog modal          |
| Admin bin panel                         | ✅ IMPLEMENTED | Deleted + Archived tabs, restore / permanent delete                  |
| Admin analytics                         | ✅ IMPLEMENTED | 6-month monthly chart, 8-week weekly chart                           |
| 30-day automatic purge                  | ⚠️ PARTIAL     | Policy documented; no automated scheduler implemented                |
| Remove admin account (Settings)         | ⚠️ PARTIAL     | Button visible; handler is a placeholder                             |
| Committees bin view                     | ⚠️ PARTIAL     | Tab exists; `deleted_at` migration not yet run on production         |

---

## Tech stack

| Layer                  | Technology                                | Version          |
| ---------------------- | ----------------------------------------- | ---------------- |
| Frontend framework     | React                                     | 19.2.0           |
| Frontend language      | TypeScript                                | 5.9.3            |
| Build tool             | Vite                                      | 7.2.2            |
| Routing                | React Router DOM                          | 7.10.1           |
| HTTP client            | Axios                                     | 1.13.5           |
| Backend framework      | Express                                   | 5.2.1            |
| Backend runtime        | Node.js ESM (no `require()`)              | —                |
| Database               | Supabase (PostgreSQL + RLS)               | JS client 2.93.0 |
| Auth                   | Supabase Auth — JWT + httpOnly cookies    | —                |
| Storage                | Supabase Storage                          | —                |
| Validation             | Zod                                       | 4.4.3            |
| File uploads           | Multer                                    | 2.0.2            |
| Security               | Helmet, sanitize-html, express-rate-limit | —                |
| Charts                 | Chart.js + Luxon                          | 4.5.1 / 3.7.2    |
| Icons                  | lucide-react, react-icons                 | 0.555.0 / 5.5.0  |
| PDF rendering (public) | pdfjs-dist                                | 5.4.624          |

---

## Quick start

Full guide: [docs/local-setup.md](docs/local-setup.md)

```bash
# 1. Clone
git clone <repo-url>
cd CSG-OITS-Dev

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment variables
cp backend/.env.example backend/.env    # fill in Supabase keys
cp frontend/.env.example frontend/.env  # set VITE_API_URL

# 4. Set up local HTTPS (required for cookie auth)
# See docs/local-setup.md → Step 3 for mkcert instructions

# 5. Run dev servers
cd backend && npm run dev    # https://localhost:3000
cd frontend && npm run dev   # http://localhost:5173
```

---

## Documentation index

| Document                                 | Description                                             |
| ---------------------------------------- | ------------------------------------------------------- |
| [Architecture](docs/architecture.md)     | System design, request flows, caching, rate limiting    |
| [API Reference](docs/api-reference.md)   | All 14 route modules — every endpoint documented        |
| [Database Schema](docs/database.md)      | Tables, columns, RLS rules, storage buckets, migrations |
| [Frontend Guide](docs/frontend.md)       | Pages, routing, outlet context, component inventory     |
| [Admin Panel Guide](docs/admin-guide.md) | Every admin panel: fields, actions, forms, tabs         |
| [Auth Flow](docs/auth.md)                | Login, cookies, requireAuth middleware, session expiry  |
| [Data Lifecycle](docs/data-lifecycle.md) | Archive / Bin / Delete — state transitions and queries  |
| [Design System](docs/design-system.md)   | All tokens, utility classes, design conventions         |
| [Local Setup](docs/local-setup.md)       | Step-by-step development environment setup              |
| [Deployment](docs/deployment.md)         | Production deployment guide and pre-launch checklist    |
| [Security](docs/security.md)             | Security measures, CSP, rate limiting, known concerns   |
| [Testing](docs/testing.md)               | Test suite guide, mocking strategy, CI integration      |
| [Contributing](CONTRIBUTING.md)          | Rules and conventions for contributors                  |
| [Changelog](CHANGELOG.md)                | Version history                                         |

---

## Project team

| Name                   | Role                                     |
| ---------------------- | ---------------------------------------- |
| John Harold R. Magma   | Project Coordinator / GAD Representative |
| Ivan P. Duran          | Committee Chair — Web Development        |
| Lorenz E. Tuboro       | Back-End Developer                       |
| Ralph Kenneth B. Perez | UI/UX Designer                           |
| Jerald D. Estrella     | Front-End Developer                      |
| Taisei Domingo         | Front-End Developer                      |
| Gerald D. Alansalon    | Documentation Officer                    |

---

## License

Academic project — Central Student Government, Cavite State University – Imus Campus, AY 2025–2026. All rights reserved.
