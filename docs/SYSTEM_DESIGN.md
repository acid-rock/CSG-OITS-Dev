# CSG-OITS System Design Document

**Project:** Online Information Transparency System
**Client:** Central Student Government — Cavite State University, Imus Campus
**Version:** 1.0
**Academic Year:** AY 2025–2026
**Last Updated:** 2026-05-17
**Status:** Active Development
**Document location:** `docs/SYSTEM_DESIGN.md`

> This document is the single authoritative technical reference for CSG-OITS.
> It covers system purpose, architecture, all modules, data design, security,
> and operational considerations in one place. For per-topic deep dives, see
> the cross-referenced files in `docs/`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Purpose and Scope](#2-system-purpose-and-scope)
3. [Stakeholders and User Roles](#3-stakeholders-and-user-roles)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Database Design](#6-database-design)
7. [API Design and Contracts](#7-api-design-and-contracts)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Admin Panel](#9-admin-panel)
10. [Authentication and Session Management](#10-authentication-and-session-management)
11. [Content Lifecycle Management](#11-content-lifecycle-management)
12. [Security Implementation](#12-security-implementation)
13. [Performance and Caching](#13-performance-and-caching)
14. [Module Reference](#14-module-reference)
15. [Design System](#15-design-system)
16. [Testing Strategy](#16-testing-strategy)
17. [Development Setup](#17-development-setup)
18. [Deployment Architecture](#18-deployment-architecture)
19. [Known Limitations and Future Work](#19-known-limitations-and-future-work)
20. [Appendix](#20-appendix)

---

## 1. Executive Summary

CSG-OITS (Online Information Transparency System) is a full-stack web application built for the Central Student Government of Cavite State University – Imus Campus. Its mandate is digital transparency: students can read all CSG announcements, download official documents, view event galleries, browse the officer roster, and submit equipment borrow requests without creating an account. CSG administrators use a password-protected panel to manage all content through a complete CRUD interface.

The system is a two-application architecture: a React 19 single-page application (frontend) communicates with an Express 5 REST API (backend) over HTTPS. All persistent data lives in Supabase (PostgreSQL with Row-Level Security), authentication is handled by Supabase Auth using httpOnly JWT cookies, and file assets are stored in Supabase Storage across 7 buckets. The backend exposes 57 endpoints across 14 route modules, backed by 12 database tables. A separate Python microservice handles PDF redaction before documents are stored.

The admin interface provides 12 dedicated content panels, each with a three-tier content lifecycle (Active → Archive → Bin → permanent delete), bulk selection, audit logging on every write operation, and an in-memory cache that keeps officer, committee, and equipment reads fast without an external cache layer. As of AY 2025–2026, all core features are fully implemented; only three items remain in a partial state: the 30-day automatic bin purge, the admin account removal action, and the committees bin-view migration.

---

## 2. System Purpose and Scope

### 2.1 Problem Statement

Before OITS, CSG transparency relied on physical bulletin boards and ad-hoc social media posts. Students had no centralized, searchable archive of official documents (resolutions, memoranda), no structured event history, and no authoritative officer roster. CSG administrators had no audit trail of who changed what, and no safe way to redact sensitive information from uploaded PDFs before they became public.

### 2.2 Scope

CSG-OITS covers the following functional domains:

| Domain | Public | Admin |
|---|---|---|
| Announcements (bulletin) | Browse, search, filter | Create, edit, pin, archive, bin, delete |
| Official documents | Browse, preview (PDF) | Upload, redact, categorize, archive, bin, delete |
| Events | Browse, view gallery | Create, add photos, archive, bin, delete |
| Officers | Browse roster, committee view | Add, edit, assign committee, archive by term |
| Committees | View list | Create, rename, archive, delete |
| Student organizations | Browse | Add, edit, logo upload, archive, bin, delete |
| Equipment borrowing | View inventory, submit request | Manage inventory, approve/reject/return requests |
| Dashboard | — | Stats, charts, storage overview |
| Audit Log | — | Read-only write history |
| Settings | — | Active term, admin accounts, password change |

### 2.3 Out of Scope

- Student accounts or logins (all public access is anonymous)
- Real-time notifications (borrow request emails use Nodemailer/SMTP; no WebSocket)
- Supabase Edge Functions or background jobs (30-day bin purge is manual)
- Mobile application

---

## 3. Stakeholders and User Roles

### 3.1 Public Users (Students)

No account required. Access is read-only. Every endpoint on the public API enforces Supabase Row-Level Security via the anon key, so only `is_archived = false AND deleted_at IS NULL` records are visible.

### 3.2 CSG Administrators

Email + password accounts created manually by an existing admin via `POST /api/v1/user/register`. Admins authenticate with httpOnly cookies and have full write access to all content panels. All write operations are recorded in the `audit_logs` table with the admin's user ID and IP address.

### 3.3 Project Lead

John Harold R. Magma (GAD Representative, 4th year CS) has final approval over visual design changes to the `/bulletin` and `/documents` public pages (per CONTRIBUTING.md Rule F5).

### 3.4 Development Team

| Name | Role |
|---|---|
| Ivan P. Duran | Committee Chair, Web Development |
| John Harold R. Magma | Project Coordinator / GAD Representative |
| Lorenz E. Tuboro | Back-End Developer |
| Ralph Kenneth B. Perez | UI/UX Designer |
| Jerald D. Estrella | Front-End Developer |
| Taisei Domingo | Front-End Developer |
| Gerald D. Alansalon | Documentation Officer |

---

## 4. Technology Stack

### 4.1 Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | DOM renderer |
| `typescript` | ~5.9.3 | Static typing |
| `vite` | ^7.2.2 | Build tool + dev server |
| `react-router-dom` | ^7.10.1 | Client-side routing, outlet context |
| `axios` | ^1.13.5 | HTTP client with cookie support |
| `chart.js` | ^4.5.1 | Dashboard charts (bar, line, pie) |
| `luxon` | ^3.7.2 | Date/time formatting |
| `lucide-react` | ^0.555.0 | Icon library (public pages) |
| `react-icons` | ^5.5.0 | Icon library (admin panel) |
| `pdfjs-dist` | ^5.4.624 | PDF rendering in the public document viewer |
| `vitest` | ^4.1.6 | Test runner |
| `@testing-library/react` | ^16.3.2 | Component testing |
| `@testing-library/user-event` | ^14.6.1 | User interaction simulation |
| `msw` | ^2.14.6 | API mocking for frontend tests |
| `jsdom` | ^29.1.1 | DOM simulation for Vitest |

### 4.2 Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP framework |
| `@supabase/supabase-js` | ^2.93.0 | Supabase client |
| `jsonwebtoken` | ^9.0.3 | JWT verification in requireAuth |
| `zod` | ^4.4.3 | Request body validation schemas |
| `multer` | ^2.0.2 | Multipart/form-data file uploads |
| `helmet` | ^8.1.0 | Security headers + CSP |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `express-rate-limit` | ^8.3.0 | Rate limiting |
| `cookie-parser` | ^1.4.7 | Cookie reading middleware |
| `sanitize-html` | ^2.17.3 | HTML content sanitization |
| `morgan` | ^1.10.1 | HTTP request logging |
| `axios` | ^1.13.5 | HTTP client (for PDF microservice calls) |
| `form-data` | ^4.0.5 | Multipart form construction for microservice |
| `nodemailer` | ^8.0.7 | Email (borrow request notifications) |
| `dotenv` | ^17.2.3 | Environment variable loading |
| `nodemon` | ^3.1.11 | Dev server auto-restart |
| `vitest` | ^4.1.6 | Test runner |
| `supertest` | ^7.2.2 | HTTP integration testing |

### 4.3 Infrastructure

| Layer | Service | Notes |
|---|---|---|
| Database | Supabase (PostgreSQL) | 12 tables, RLS on all |
| Auth | Supabase Auth | Email/password, JWT, httpOnly cookies |
| Storage | Supabase Storage | 7 public buckets |
| PDF Redaction | Python microservice | `PDF_REDACT_URL` env var |
| DNS / CDN / DDoS | Cloudflare | Recommended for production |
| Frontend hosting | Vercel / Netlify / Cloudflare Pages | React SPA (static) |
| Backend hosting | Railway / Render / Fly.io | Node.js ESM process |
| Local HTTPS | mkcert | Required for httpOnly cookie auth |

---

## 5. System Architecture

### 5.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│   React 19 SPA (Vite 7)                                      │
│   • Public pages — no auth required                          │
│   • Admin panel — protected by httpOnly cookie               │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS + Axios (withCredentials)
                            │ credentials: httpOnly cookies
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Express 5 Backend (Node.js ESM)                 │
│   • Helmet CSP + CORS + Morgan + rate limiters               │
│   • requireAuth — JWT verification from sb_access_token      │
│   • validate(schema) — Zod request validation                │
│   • auditLogger — fire-and-forget audit log writes           │
│   • In-memory cache (officers, committees, equipment,        │
│     dashboard)                                               │
│   Routes: /api/v1/{announcements, documents, events,         │
│     officers, committees, organizations, equipment,          │
│     dashboard, settings, analytics, auditlog, borrowing,     │
│     changelog, user}                                         │
└──────────────┬───────────────────────────┬───────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│         Supabase          │  │   PDF Redaction Microservice   │
│  PostgreSQL (12 tables)   │  │   (Python — PDF_REDACT_URL)    │
│  Supabase Auth (JWT)      │  │   POST /api/v1/redact          │
│  Storage (7 buckets)      │  │   POST /api/v1/thumbnail/create│
│  RLS on all tables        │  └────────────────────────────────┘
└──────────────────────────┘
```

### 5.2 Request Flow — Public Page Load

When a student opens any public page, `Root-layout.tsx` drives a parallel data fetch before any child route renders:

1. Browser loads `https://<frontend>/` — React Router renders `<RootLayout>`.
2. `Root-layout.tsx` fires `Promise.allSettled([...])` with six parallel requests:
   - `GET /api/v1/settings/term` — active academic term
   - `fetchBulletinData()` → `GET /api/v1/announcements/`
   - `fetchDocuments()` → `GET /api/v1/documents/`
   - `fetchEvents()` → `GET /api/v1/events/`
   - `fetchOfficers(activeTerm)` → `GET /api/v1/officers/`
   - `axios.get('/organizations/')` → `GET /api/v1/organizations/`
3. Express applies `publicLimiter` (100 req/15 min per IP) to each route.
4. Route handlers query Supabase with `anonSupabase` (RLS enforced). Officers and committees may be served from the in-memory cache.
5. Supabase returns public/signed URLs for storage assets inline.
6. `Root-layout.tsx` collects results via `Promise.allSettled` — partial failures are tolerated.
7. Resolved data is passed via `<Outlet context={...}>` to all child routes.
8. Child routes consume data with `useOutletContext<OutletContextType>()`.

### 5.3 Request Flow — Admin Write Operation

When an admin submits an "Add Announcement" form:

1. Admin fills the form and clicks Save.
2. `Form.tsx` builds a `FormData` payload; calls `axios.post('/api/v1/announcements/add', formData, { withCredentials: true })`.
3. Browser attaches `sb_access_token` httpOnly cookie automatically.
4. Express routes the request through:
   - `adminLimiter` (500 req/15 min)
   - `requireAuth` — verifies JWT; refreshes token transparently if expired
   - `validate(addAnnouncementSchema)` — Zod validates body fields; replaces `req.body` with parsed data
   - `auditLogger('INSERT')` — wraps `res.json` to fire-and-forget an audit log INSERT on 2xx
5. Route handler executes:
   - Multer parses the image file into `req.file` (memory storage)
   - `validateImageUpload(req.file)` — checks MIME type and size
   - `sanitizeContent(content)` — strips disallowed HTML tags
   - Supabase service-key storage upload → `supabase.storage.from('bulletin').upload(...)`
   - `supabase.from('bulletin').insert(...)` via service client
6. `invalidateCachePrefix('officers:')` (or equivalent) called after success.
7. Backend returns `{ message: 'Announcement created successfully.', data: {...} }` — 201.
8. Frontend panel re-fetches the active list via `fetchData()`.

### 5.4 Request Flow — Admin Authentication

1. Admin submits email + password at `/admin/login`.
2. `axios.post('/api/v1/user/login', { email, password }, { withCredentials: true })`
3. Backend: `validate(loginSchema)` → `anonSupabase.auth.signInWithPassword({ email, password })`
4. On success, two httpOnly cookies are set:
   - `sb_access_token` (JWT, 1-hour TTL, `secure: true`, `sameSite: 'strict'`)
   - `sb_refresh_token` (7-day TTL, same flags)
5. Backend returns `{ message: "Login successful." }` — 200.
6. Frontend sets `localStorage.setItem('admin_authenticated', '1')` (UI gate only).
7. React Router navigates to `/admin`.
8. `requireAuth` verifies the cookie JWT on every subsequent protected request.

---

## 6. Database Design

All tables are managed by Supabase (PostgreSQL). No ORM is used — the Supabase JS client issues raw queries. Row-Level Security is enabled on all tables.

### 6.1 Table: `bulletin`

Stores CSG announcements.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `title` | text | No | — | Announcement headline (unique in migration 001; uniqueness may have been relaxed) |
| `content` | text | No | — | HTML-sanitized body (sanitize-html allowlist) |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `owner_id` | uuid | Yes | `NULL` | FK → `auth.users.id` |
| `is_pinned` | bool | No | `false` | Only one row may be `true` at a time |
| `is_archived` | bool | No | `false` | Archive state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp (Bin state) |
| `category` | text | No | `'CSG Updates'` | Enum: CSG Updates, Class Advisories, Examinations, University Events, Official CVSU |
| `term_year` | text | Yes | `NULL` | Format: `AY YYYY-YYYY` |

Associated storage: `bulletin/{id}.jpg`

### 6.2 Table: `documents`

Stores official PDF documents.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `file_path` | text | No | — | Storage path in `documents` bucket |
| `name` | text | Yes | `NULL` | Display name |
| `description` | text | Yes | `NULL` | Human-readable description |
| `category` | text | Yes | `NULL` | Document type (Resolution, Memorandum, etc.) |
| `created_at` | timestamptz | No | `now()` | Upload timestamp |
| `owner_id` | uuid | Yes | `NULL` | FK → `auth.users.id` |
| `is_archived` | bool | No | `false` | Archive state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |
| `term_year` | text | Yes | `NULL` | Academic term |

Associated storage: `documents/{id}.pdf`, `thumbnails/{id}.png`

### 6.3 Table: `events`

Stores CSG events.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Event name |
| `description` | text | No | — | HTML-sanitized description |
| `date_happened` | date | No | — | Date the event occurred |
| `created_at` | timestamptz | No | `now()` | Record creation timestamp |
| `ip_address` | text | Yes | `NULL` | Admin IP at creation time |
| `user_agent` | text | Yes | `NULL` | Admin browser at creation time |
| `is_archived` | bool | No | `false` | Archive state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |
| `term_year` | text | Yes | `NULL` | Academic term |

Associated storage: `events/{id}/image_0.jpg`, `image_1.jpg`, `image_2.jpg` (up to 3)

### 6.4 Table: `officers`

Stores CSG officer profiles.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `full_name` | text | No | — | Officer's full name |
| `position` | text | No | — | Position or title |
| `type` | text | No | — | `executive`, `board`, `adviser`, or `former` |
| `avatar` | text | Yes | `NULL` | Storage path in `officers` bucket |
| `socials` | text | Yes | `NULL` | Facebook profile URL |
| `year_serving` | text | Yes | `NULL` | Academic year string |
| `student_number` | text | Yes | `NULL` | Student ID |
| `committee` | integer | Yes | `NULL` | FK → `committees.id` (INTEGER — always `parseInt()`) |
| `is_committee_official` | bool | No | `false` | Whether this officer heads the committee |
| `status` | text | No | `'active'` | `'active'` or `'archived'` — used instead of `is_archived` |
| `term_year` | text | Yes | `NULL` | Set when officer is archived |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |

**Special rule:** Officers use `status` (not `is_archived`) for the archive state. See ADR 002.

Associated storage: `officers/{id}.jpg`

### 6.5 Table: `committees`

Stores CSG committees.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | integer | No | auto-increment | **INTEGER primary key — NOT UUID. Always `parseInt()`.** |
| `name` | text | No | — | Committee name |
| `status` | text | No | `'active'` | `'active'` or `'archived'` |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp [VERIFY: migration may not be applied in production] |

**Critical:** `id` is an INTEGER. Passing a string to Supabase for integer comparison produces silently wrong results. See ADR 004.

### 6.6 Table: `organizations`

Stores affiliated student organizations.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Organization name |
| `description` | text | Yes | `NULL` | Brief description |
| `logo_path` | text | Yes | `NULL` | Storage path in `organizations` bucket |
| `facebook_link` | text | Yes | `NULL` | Facebook page URL |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `is_archived` | bool | No | `false` | Archive state |
| `deleted_at` | timestamptz | Yes | `NULL` | Soft-delete timestamp |

Associated storage: `organizations/{id}.jpg`

### 6.7 Table: `inventory`

Stores borrowable equipment. The database table name is `inventory`, not `equipment`.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `name` | text | No | — | Equipment name |
| `quantity` | integer | No | `0` | Current available units |
| `max_quantity` | integer | No | — | Total units owned |
| `is_available` | bool | No | `true` | Whether currently available for borrowing |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

### 6.8 Table: `borrowing_requests`

Stores student equipment borrow requests.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `borrower_name` | text | No | — | Requester's full name |
| `borrower_id` | text | No | — | Student ID number |
| `email` | text | No | — | Student email |
| `contact_number` | text | Yes | `NULL` | Phone number |
| `organization` | text | Yes | `NULL` | Student's organization |
| `position_in_org` | text | Yes | `NULL` | Role in organization |
| `equipment_name` | text | No | — | Equipment requested (denormalized name) |
| `quantity_requested` | integer | No | — | Units requested |
| `purpose_type` | text | Yes | `NULL` | `academic`, `event`, `organization`, `others` |
| `activity_name` | text | Yes | `NULL` | Name of the activity |
| `venue` | text | Yes | `NULL` | Location |
| `time_of_use` | text | Yes | `NULL` | Planned time |
| `borrow_date` | date | No | — | Start date |
| `return_date` | date | Yes | `NULL` | Expected return date |
| `status` | text | No | `'pending'` | `pending`, `approved`, `rejected`, `returned` |
| `admin_notes` | text | Yes | `NULL` | Admin notes on approval/rejection |
| `created_at` | timestamptz | No | `now()` | Submission timestamp |

### 6.9 Table: `profiles`

Maps Supabase Auth users to admin roles.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `owner_id` | uuid | No | — | **Primary key. Maps to `auth.users.id`. There is NO separate `id` column in production.** [VERIFY: migration 001 added both `id` and `owner_id`; current code treats `owner_id` as sole PK] |
| `role` | text | Yes | `NULL` | Role string, e.g. `'admin'` |

### 6.10 Table: `whitelist`

Pre-approved student emails/IDs for restricted features.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `email` | text | Yes | `NULL` | Student email (optional) |
| `full_name` | text | Yes | `NULL` | Student name [VERIFY: added as later migration] |
| `student_id` | text | Yes | `NULL` | Student ID (optional) [VERIFY: added as later migration] |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |

At least one of `email` or `student_id` must be provided. Only the service key can read/write.

### 6.11 Table: `settings`

Key-value store for system configuration.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `key` | text | No | — | Primary key |
| `value` | text | Yes | `NULL` | Setting value |

Current key: `active_term` — the displayed academic term (e.g., `'AY 2025-2026'`).

### 6.12 Table: `audit_logs`

Records all admin write operations.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `action` | text | No | — | `INSERT`, `UPDATE`, or `DELETE` |
| `entity` | text | No | — | Table affected (e.g., `'bulletin'`) |
| `entity_id` | text | Yes | `NULL` | ID of affected record |
| `created_by` | uuid | Yes | `NULL` | FK → `auth.users.id` |
| `ip_address` | text | Yes | `NULL` | Request IP address |
| `created_at` | timestamptz | No | `now()` | Log timestamp |

### 6.13 Storage Buckets

| Bucket | Path pattern | Public | Contents |
|---|---|---|---|
| `bulletin` | `{uuid}.jpg` | Yes | Announcement cover images |
| `documents` | `{uuid}.pdf` | Yes | Redacted PDF files |
| `thumbnails` | `{uuid}.png` | Yes | Document thumbnail PNGs |
| `events` | `{uuid}/image_0.jpg`, `image_1.jpg`, `image_2.jpg` | Yes | Event photo galleries |
| `officers` | `{uuid}.jpg` | Yes | Officer avatar photos |
| `organizations` | `{uuid}.jpg` | Yes | Organization logos |
| `equipment` | `{uuid}.jpg` | Yes | Equipment item photos |

### 6.14 Common Query Patterns

```js
// Active records (public)
.eq('is_archived', false).is('deleted_at', null)

// Archived records (admin only)
.eq('is_archived', true).is('deleted_at', null)

// Bin records (admin only)
.not('deleted_at', 'is', null)

// Officers — use status, not is_archived
.eq('status', 'active').is('deleted_at', null)

// Committees — ALWAYS parseInt
const id = parseInt(req.body.id, 10);
.from('committees').select('*').eq('id', id)

// Profiles — use owner_id, not id
.from('profiles').select('role').eq('owner_id', req.user.sub).single()
```

---

## 7. API Design and Contracts

**Base URL:** `/api/v1`
**Auth:** httpOnly cookie `sb_access_token` (Supabase JWT)
**Content-Type:** `application/json` or `multipart/form-data` for file uploads
**Health check:** `GET /health` → `200 OK` (no auth, no rate limit)

### 7.1 Complete Endpoint Inventory

| Method | Path | Auth | Rate Limit | Purpose |
|---|---|---|---|---|
| `GET` | `/health` | No | None | Health check |
| `POST` | `/user/login` | No | Admin | Sign in, set cookies |
| `POST` | `/user/logout` | No | Admin | Clear cookies |
| `POST` | `/user/register` | Yes | Admin | Create admin account |
| `GET` | `/user/me` | Yes | Admin | Current user info |
| `POST` | `/user/forgot-password` | No | Admin | Send reset email |
| `POST` | `/user/reset-password` | No | Admin | Reset with OTT |
| `POST` | `/user/change-password` | Yes | Admin | Change own password |
| `GET` | `/user/whitelist` | Yes | Admin | List whitelist |
| `POST` | `/user/whitelist` | Yes | Admin | Add to whitelist |
| `DELETE` | `/user/whitelist` | Yes | Admin | Remove from whitelist |
| `GET` | `/user/list` | Yes | Admin | List all admin accounts |
| `GET` | `/announcements/` | No | Public | Active announcements |
| `GET` | `/announcements/archived` | Yes | Public | Archived announcements |
| `GET` | `/announcements/bin` | Yes | Public | Binned announcements |
| `POST` | `/announcements/add` | Yes | Public | Create announcement |
| `POST` | `/announcements/edit` | Yes | Public | Edit announcement |
| `POST` | `/announcements/pin` | Yes | Public | Pin one announcement |
| `POST` | `/announcements/archive` | Yes | Public | Archive (batch) |
| `POST` | `/announcements/restore` | Yes | Public | Restore from archive |
| `POST` | `/announcements/bin` | Yes | Public | Move to bin |
| `POST` | `/announcements/restore-from-bin` | Yes | Public | Restore from bin |
| `DELETE` | `/announcements/delete` | Yes | Public | Hard delete |
| `GET` | `/documents/` | No | Public | Active documents |
| `GET` | `/documents/archived` | Yes | Public | Archived documents |
| `GET` | `/documents/bin` | Yes | Public | Binned documents |
| `POST` | `/documents/add` | Yes | Public | Upload + redact PDF |
| `POST` | `/documents/edit` | Yes | Public | Edit document |
| `POST` | `/documents/archive` | Yes | Public | Archive |
| `POST` | `/documents/restore` | Yes | Public | Restore from archive |
| `POST` | `/documents/bin` | Yes | Public | Move to bin |
| `POST` | `/documents/restore-from-bin` | Yes | Public | Restore from bin |
| `DELETE` | `/documents/delete` | Yes | Public | Hard delete |
| `DELETE` | `/documents/bin/purge` | Yes | Public | Purge old bin items |
| `GET` | `/events/` | No | Public | Active events |
| `GET` | `/events/archived` | Yes | Public | Archived events |
| `GET` | `/events/bin` | Yes | Public | Binned events |
| `POST` | `/events/add` | Yes | Public | Create event |
| `POST` | `/events/edit` | Yes | Public | Edit event |
| `POST` | `/events/archive` | Yes | Public | Archive |
| `POST` | `/events/restore` | Yes | Public | Restore from archive |
| `POST` | `/events/bin` | Yes | Public | Move to bin |
| `POST` | `/events/restore-from-bin` | Yes | Public | Restore from bin |
| `DELETE` | `/events/delete` | Yes | Public | Hard delete |
| `GET` | `/officers/` | No | Public | Active officers (cached) |
| `GET` | `/officers/terms` | No | Public | Distinct term years |
| `GET` | `/officers/archived` | Yes | Public | Archived officers (cached) |
| `POST` | `/officers/add` | Yes | Public | Add officer |
| `POST` | `/officers/edit` | Yes | Public | Edit officer |
| `POST` | `/officers/archive` | Yes | Public | Archive officer |
| `POST` | `/officers/restore` | Yes | Public | Restore officer |
| `DELETE` | `/officers/delete` | Yes | Public | Hard delete officer |
| `GET` | `/committees/` | No | Public | Active + archived committees (cached) |
| `POST` | `/committees/add` | Yes | Public | Create committee |
| `POST` | `/committees/edit` | Yes | Public | Rename committee |
| `POST` | `/committees/archive` | Yes | Public | Archive (batch) |
| `POST` | `/committees/restore` | Yes | Public | Restore |
| `DELETE` | `/committees/delete` | Yes | Public | Hard delete |
| `GET` | `/organizations/` | No | Public | Active organizations |
| `GET` | `/organizations/archived` | Yes | Public | Archived organizations |
| `GET` | `/organizations/bin` | Yes | Public | Binned organizations |
| `POST` | `/organizations/add` | Yes | Public | Create organization |
| `POST` | `/organizations/edit` | Yes | Public | Edit organization |
| `POST` | `/organizations/archive` | Yes | Public | Archive |
| `POST` | `/organizations/restore` | Yes | Public | Restore from archive |
| `POST` | `/organizations/bin` | Yes | Public | Move to bin |
| `POST` | `/organizations/restore-from-bin` | Yes | Public | Restore from bin |
| `DELETE` | `/organizations/delete` | Yes | Public | Hard delete |
| `GET` | `/equipment/` | No | Public | All equipment (cached 60s) |
| `GET` | `/borrowing/inventory` | No | Admin | Inventory list |
| `GET` | `/borrowing/inventory/:id` | No | Admin | Single inventory item |
| `POST` | `/borrowing/inventory/add` | Yes | Admin | Add equipment |
| `POST` | `/borrowing/inventory/edit` | Yes | Admin | Edit equipment |
| `DELETE` | `/borrowing/inventory/delete` | Yes | Admin | Delete equipment |
| `GET` | `/borrowing/requests` | Yes | Admin | Borrow requests (filterable) |
| `POST` | `/borrowing/request` | No | Admin | Submit borrow request (public) |
| `POST` | `/borrowing/approve` | Yes | Admin | Approve request |
| `POST` | `/borrowing/reject` | Yes | Admin | Reject request |
| `POST` | `/borrowing/return` | Yes | Admin | Mark returned |
| `DELETE` | `/borrowing/requests/delete` | Yes | Admin | Delete request |
| `GET` | `/dashboard/summary` | No | Admin | Counts + pinned (cached 60s) |
| `GET` | `/dashboard/storage` | Yes | Admin | Bucket sizes (cached 300s) |
| `GET` | `/settings/` | Yes | Admin | All settings |
| `POST` | `/settings/` | Yes | Admin | Upsert setting |
| `GET` | `/settings/:key` | No | Admin | Get setting by key |
| `POST` | `/settings/:key` | Yes | Admin | Set setting by key |
| `GET` | `/analytics/` | Yes | Admin | Monthly + weekly doc charts |
| `GET` | `/auditlog/` | Yes | Admin | Audit log entries |
| `GET` | `/changelog/` | No | Public | CHANGELOG.md as text |

### 7.2 Standard Error Response

```json
{ "error": "Description of what went wrong." }
```

| Code | Meaning |
|---|---|
| 400 | Zod validation failure or missing required field |
| 401 | Session expired — no valid refresh token |
| 403 | Not authenticated — no cookies present |
| 404 | Route not found |
| 413 | File too large (image > 5 MB, PDF > 20 MB) |
| 415 | Wrong MIME type |
| 429 | Rate limit exceeded |
| 500 | Supabase error, storage error, or unexpected server error |

In `NODE_ENV=production`, stack traces are suppressed from 500 responses.

### 7.3 File Upload Constraints

| Upload field | Allowed MIME types | Max size |
|---|---|---|
| Images (`image`, `avatar`, `logo`, `image_0/1/2`) | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` | 5 MB |
| PDF documents (`file`) | `application/pdf` | 20 MB |

---

## 8. Frontend Architecture

### 8.1 Route Table

All routes defined in `frontend/src/main.tsx`:

| Path | Component | Layout | Access | Description |
|---|---|---|---|---|
| `/` | `route/homepage/App.tsx` | `RootLayout` | Public | Homepage |
| `/bulletin` | `route/bulletin/Bulletin.tsx` | `RootLayout` | Public | Announcements |
| `/documents` | `route/documents/Documents.tsx` | `RootLayout` | Public | Documents |
| `/events` | `route/events/Events.tsx` | `RootLayout` | Public | Events gallery |
| `/about` | `route/about/AboutPage.tsx` | `RootLayout` | Public | About CSG |
| `/officers` | `route/officers/Officers.tsx` | `RootLayout` | Public | Officer roster |
| `/borrow` | `route/borrow/Borrow.tsx` | `RootLayout` | Public | Borrow form |
| `/contributors` | `route/contributors/Contributors.tsx` | `RootLayout` | Public | Dev team |
| `/organizations` | `route/organizations/OrganizationsPage.tsx` | `RootLayout` | Public | Organizations |
| `/admin/login` | `admin/admin-loginpage/login/Login.tsx` | None | Public | Login page |
| `/admin/forgot-password` | `admin/admin-loginpage/forgot/Forgot.tsx` | None | Public | Forgot password |
| `/admin/reset-password` | `admin/admin-loginpage/reset/Reset.tsx` | None | Public | Reset password |
| `/admin` | `admin/AdminPage.tsx` | `ProtectedRoute` | Auth | Admin panel shell |
| `/bin` | `Navigate` | `ProtectedRoute` | Auth | Redirects to `/admin?panel=bin` |

`RootLayout` = `Root-layout.tsx` — wraps all public routes with data fetch and outlet context.
`ProtectedRoute` = `admin/ProtectedRoute.tsx` — checks `localStorage.getItem('admin_authenticated')`.

### 8.2 Outlet Context Type

```tsx
interface Announcement {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
  is_pinned?: boolean;
  category?: string;
}

interface Document {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  date: string;
  created_at?: string;
  term?: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  folder: string;
  date: string;
  images: string[];
}

interface Officer {
  id: string;
  full_name: string;
  position: string | string[];
  avatar: string;
  type: string;
  socials?: string;
  year_serving: string;
  student_number?: string;
  committee?: number;
  is_committee_official: boolean;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_path?: string;
  facebook_link?: string;
  created_at: string;
}

interface OutletContextType {
  bulletin: Announcement[];
  documents: Document[];
  events: Event[];
  officers: Officer[];
  organizations: Organization[];
}
```

### 8.3 State Management

No Redux, Zustand, or other global state library is used.

| Pattern | Where used |
|---|---|
| `useState` per component | Admin panels manage their own `data`, `loading`, `error`, `tab`, `filter`, `sort`, `selectedIds` |
| `useOutletContext` | Public pages consume pre-fetched data from `Root-layout.tsx` |
| `useCallback` + `useEffect` | Admin panels use `fetchData = useCallback(...)` called in `useEffect([fetchData])` |
| `onSuccess` callback | After any write, components call `onSuccess?.()` → `fetchData()` re-fetches |

### 8.4 Config Functions

Located in `frontend/src/config/`:

| File | Function | API Call |
|---|---|---|
| `axiosInstance.ts` | — | Axios instance with `baseURL: VITE_API_URL`, `withCredentials: true` |
| `bulletinConfig.ts` | `fetchBulletinData()` | `GET /announcements/` |
| `documentsConfig.ts` | `fetchDocuments(page?, limit?)` | `GET /documents/` |
| `eventConfig.ts` | `fetchEvents()` | `GET /events/` |
| `officerConfig.ts` | `fetchOfficers(page?, limit?, term?)` | `GET /officers/` |
| `committeeConfig.ts` | `fetchCommittees()` | `GET /committees/` |
| `organizationsConfig.ts` | `fetchOrganizations()` | `GET /organizations/` |
| `navigationConfig.tsx` | — | Navigation dropdown structure |
| `officers-board-members.ts` | — | Static helper config |

---

## 9. Admin Panel

### 9.1 Panel Inventory

The admin panel is a single route (`/admin`) where internal navigation is driven by the `?panel=` URL query parameter. `ContentPanel.tsx` reads `useSearchParams()` and renders the matching component:

| `?panel=` value | Component | Source file | Description |
|---|---|---|---|
| `dashboard` (default) | `Dashboard` | `panel/dashboard/Dashboard.tsx` | Stats cards + charts + recent activity |
| `announcement` | `Announcement` | `panel/announcement/Announcement.tsx` | Bulletin CRUD |
| `documents` | `Documents` | `panel/documents/Document.tsx` | PDF document CRUD |
| `events` | `Events` | `panel/events/Events.tsx` | Event gallery CRUD |
| `officers` | `OfficersPanel` | `panel/officers/Officers.tsx` | Officer roster management |
| `committees` | `CommitteesPanel` | `panel/committees/Committees.tsx` | Committee management |
| `borrowing` | `BorrowingPanel` | `panel/borrowing/Borrowing.tsx` | Equipment + borrow requests |
| `organizations` | `OrganizationsPanel` | `panel/organizations/Organizations.tsx` | Organization management |
| `auditlog` | `Audit` | `panel/auditlog/Auditlog.tsx` | Read-only audit log |
| `contributors` | `Contributor` | `panel/contributors/Contributor.tsx` | Dev team credits |
| `settings` | `Settings` | `panel/settings/Settings.tsx` | Term, accounts, password, changelog |
| `bin` | `Bin` | `route/bin/Bin.tsx` | Deleted + Archived tabs |

### 9.2 Admin Panel UX Patterns

**Three-tab pattern** — most panels have Active, Archived, and Bin tabs. The active tab queries the active list; clicking a tab re-fetches and resets selection state.

**Hover action buttons** — admin tables hide action buttons (Edit, Archive, Delete) by default. They appear only when the row is hovered (`hoveredRowId === id`). This keeps the table clean and prevents accidental clicks.

**Bulk selection** — checkboxes in the leftmost column. When any row is selected, `Actionbar.tsx` floats at the bottom of the screen showing count + Archive/Delete buttons. Clicking a bulk action opens `ConfimationModal` before executing.

**Form modals** — `Form.tsx` (universal for Announcements, Documents, Events) and `OfficerForm.tsx` are full-screen modals controlled by `forType` prop. Forms use `useLockBodyScroll` hook.

### 9.3 Sidebar Configuration

Defined in `frontend/src/admin/components/sidebar/dashboard-buttonConfig.tsx`. Sidebar groups:

| Section | Panels |
|---|---|
| Overview | Dashboard |
| Content | Announcements, Documents, Events, Officers, Committees, Organizations |
| Operations | Equipment (Borrowing), Audit Log, Contributors, Settings, Bin |

The sidebar displays the logged-in admin's name and initial-avatar, fetched from `GET /user/me`. Logout calls `POST /user/logout` and clears the localStorage flag.

### 9.4 Session Expiry in Admin

An axios interceptor in `AdminPage.tsx` catches 401 responses and sets `sessionExpired = true`, which renders `SessionExpiredModal` — a full-screen overlay with a "Go to Login" button. Clicking it clears `localStorage` and navigates to `/admin/login`.

---

## 10. Authentication and Session Management

### 10.1 Cookie Specification

| Cookie | Value | httpOnly | Secure | SameSite | Max-Age |
|---|---|---|---|---|---|
| `sb_access_token` | Supabase JWT | Yes | Yes | Strict | 1 hour (3,600,000 ms) |
| `sb_refresh_token` | Supabase refresh token | Yes | Yes | Strict | 7 days (604,800,000 ms) |

- `httpOnly: true` — JavaScript cannot read these cookies. XSS cannot steal session tokens.
- `secure: true` — cookies only sent over HTTPS. **Local development requires mkcert.**
- `sameSite: 'strict'` — cookies not sent on cross-site requests. Eliminates CSRF.

### 10.2 `requireAuth` Middleware

Source: `backend/src/middlewares/auth.middleware.js`

1. Reads `sb_access_token` and `sb_refresh_token` from `req.cookies`.
2. If neither present: returns `403 { message: "Not authenticated." }`.
3. Calls `jwt.verify(accessToken, SUPABASE_JWT_SECRET)`.
4. On success: sets `req.user = payload`, `req.token = accessToken`, calls `next()`.
5. On JWT error (expired/invalid):
   - No refresh token → returns `401 { error: "Session expired" }`.
   - Has refresh token → calls `supabase.auth.refreshSession({ refresh_token })`.
     - Success: sets new cookies in response, sets `req.user = data.session.user`, calls `next()`.
     - Failure: returns `401 { error: "Session expired" }`.

### 10.3 `req.user` Shape

After JWT verification, `req.user` contains the JWT payload including `sub` (Supabase user UUID) and `email`. After a token refresh, `req.user` is the full Supabase User object with `id` and `user_metadata`.

### 10.4 ProtectedRoute

`frontend/src/admin/ProtectedRoute.tsx` checks `localStorage.getItem('admin_authenticated') === '1'`. This is a UI gate only — it does not verify the actual session. The backend's `requireAuth` middleware enforces real authentication on every API call.

### 10.5 Registration and Password Management

- **Register:** `POST /user/register` requires an existing admin session. Creates account via `supabase.auth.admin.createUser()` (service key) + inserts `profiles` row. Password must be ≥ 8 chars, ≤ 72 chars, contain uppercase and a number. Email confirmation required before login.
- **Forgot password:** Always returns 200 regardless of email existence (avoids user enumeration).
- **Reset password:** One-time token from email link; `new_password` must be ≥ 8 chars.
- **Change password:** Re-authenticates with current password before updating.

---

## 11. Content Lifecycle Management

### 11.1 State Machine

```
                ┌─────────────────┐
                │     ACTIVE      │ ◄─────────────────────────┐
                │  is_archived=F  │                           │
                │  deleted_at=NULL│                           │
                └────────┬────────┘                           │
                         │                                    │
           ┌─────────────┼─────────────┐                     │
    Archive│         Move│to Bin       │            Restore   │
           ▼             ▼             │            from bin  │
  ┌─────────────┐  ┌─────────────┐    │                      │
  │  ARCHIVED   │  │     BIN     │────┘──────────────────────►│
  │is_archived=T│  │deleted_at=  │   Restore                  │
  │deleted_at=  │  │  timestamp  │   from archive             │
  │   NULL      │  │             │──────────────────────────► │
  └──────┬──────┘  └──────┬──────┘                           │
         │                │                                   │
Restore  │        Permanent│Delete                            │
to Active│       (from Bin)▼(irreversible)                    │
         └──────────► (gone) ◄──────────────────────────────  │
                    Hard DELETE from DB + Storage files removed
```

### 11.2 Database Representation

| State | `is_archived` | `deleted_at` | Visible to |
|---|---|---|---|
| Active | `false` | `NULL` | Public + Admin |
| Archived | `true` | `NULL` | Admin only |
| Bin | any | NOT NULL | Admin Bin panel only |

Applies to: `bulletin`, `documents`, `events`, `organizations`.

### 11.3 SQL Query Patterns

```sql
-- Active (public and admin Active tab)
WHERE is_archived = false AND deleted_at IS NULL

-- Archived (admin Archived tab)
WHERE is_archived = true AND deleted_at IS NULL

-- Bin (admin Bin panel)
WHERE deleted_at IS NOT NULL
```

### 11.4 Officers Variant

Officers use `status` (`'active'` | `'archived'`) instead of `is_archived`. This was intentional (ADR 002) — the archived state carries contextual meaning for officers (which term they served). The `deleted_at` column is still used for the Bin state.

| State | DB query |
|---|---|
| Active | `.eq('status', 'active').is('deleted_at', null)` |
| Archived | `.eq('status', 'archived').is('deleted_at', null)` |
| Bin | `.not('deleted_at', 'is', null)` |

Archiving an officer **requires** a `term_year` value — this records the officer's serving term.

### 11.5 30-Day Bin Policy

Items in the Bin should be purged after 30 days. This policy is enforced manually only — no automated scheduler exists. Admins must purge from the Bin panel or call `DELETE /documents/bin/purge`. See section 19 for the automation gap.

### 11.6 Announcement Pinning

At most one announcement may be pinned. `POST /announcements/pin`:
1. Sets `is_pinned = false` on all announcements.
2. Sets `is_pinned = true` on the target.

The pinned announcement appears as the hero card on `/bulletin` and as the "Latest Update" strip on the homepage.

---

## 12. Security Implementation

### 12.1 Eight-Layer Security Stack

| Layer | Implementation | Source |
|---|---|---|
| 1. Input validation | Zod schemas on all write endpoints | `middlewares/validate.middleware.js` + `schemas/index.js` |
| 2. Authentication | httpOnly JWT cookies verified on every write | `middlewares/auth.middleware.js` |
| 3. File upload validation | MIME type + size checks | `lib/uploadValidation.js` |
| 4. HTML sanitization | sanitize-html on announcement/event content | `lib/sanitize.js` |
| 5. Content Security Policy | Helmet CSP with tight directives | `app.js` |
| 6. CORS | Restricted to `FRONTEND_URL` only | `app.js` |
| 7. Rate limiting | 100/15min (public), 500/15min (admin) | `app.js` |
| 8. Audit logging | Every write logged with user + IP | `middlewares/audit.middleware.js` |

### 12.2 Helmet CSP Configuration (from `app.js`)

| Directive | Value | Reason |
|---|---|---|
| `defaultSrc` | `'self'` | Block all third-party by default |
| `scriptSrc` | `'self'` | No third-party JavaScript |
| `styleSrc` | `'self'`, `'unsafe-inline'` | Inline styles required for token values |
| `imgSrc` | `'self'`, Supabase host, `data:`, `blob:` | Officer avatars, announcement images |
| `frameSrc` | `'self'`, Supabase host | PDF iframe in document viewer |
| `objectSrc` | `'none'` | Block Flash/Java plugins |
| `frameAncestors` | `'none'` | Prevent clickjacking |
| `upgradeInsecureRequests` | — | Force HTTP → HTTPS |

`crossOriginEmbedderPolicy: false` is required so the PDF iframe from Supabase Storage can load.

**Frontend CSP (Vercel):** The Helmet CSP above applies only to backend API responses. The static React app is served by Vercel under its own CSP header in `frontend/vercel.json`, which mirrors these directives and additionally whitelists the third-party origins the frontend loads:

| Directive | Added origin | Used by |
|---|---|---|
| `style-src` | `https://fonts.googleapis.com` | Google Fonts `css2` stylesheet (`index.html`) |
| `font-src` | `https://fonts.gstatic.com` | Google Fonts `.woff2` files |
| `frame-src` | `https://maps.google.com`, `https://www.google.com` | embedded Google Map on `/office` |
| `img-src` | `https://*.tile.openstreetmap.org` | OpenStreetMap tiles for the admin geofence map |

The admin geofence map renders Leaflet directly in React (shared `GeofenceMap` component) rather than via a `srcDoc` iframe loading a CDN + inline script, so it requires no `script-src` relaxation. Edits to `frontend/vercel.json` only take effect on a Vercel redeploy.

### 12.3 HTML Sanitization Allowlist

`lib/sanitize.js` allows only: `b`, `strong`, `i`, `em`, `u`, `a`, `br`, `p`.
Allowed attributes: `href`, `target`, `rel` on `<a>` only.
Allowed URL schemes: `http`, `https`, `mailto`.
All `<a>` tags automatically get `rel="noopener noreferrer"` and `target="_blank"`.

Note: The allowlist in `sanitize.js` is narrower than what `docs/security.md` describes (which lists `h1`–`h6`, `ul`, `ol`, `li`, `blockquote` as well). The actual enforced set is the 8-tag list above.

### 12.4 Known Security Limitations

| Concern | Severity | Status |
|---|---|---|
| MIME type validation uses client-reported type | Low | File magic-byte sniffing not implemented |
| Admin registration has no permission tier enforcement | Medium | Any admin can register new admins |
| 30-day bin purge not automated | Low | Manual process required |
| `unsafe-inline` in `styleSrc` | Low | Required for dynamic token values |
| No brute-force lockout | Low | Supabase Auth + adminLimiter provide throttling |

---

## 13. Performance and Caching

### 13.1 Cache Inventory

The in-memory cache in `backend/src/lib/cache.js` uses a JavaScript `Map` with TTL timestamps. It is per-process and lost on server restart.

| Cache key | TTL | Invalidated by |
|---|---|---|
| `officers:active` | 60 s | Any write to officers table |
| `officers:archived` | 60 s | Any write to officers table |
| `committees:active` | 60 s | Any write to committees table |
| `committees:archived` | 60 s | Any write to committees table |
| `equipment:all` | 60 s | Any write to inventory table |
| `dashboard:summary` | 60 s | Self-expiring only |
| `dashboard:storage` | 300 s | Self-expiring only |

### 13.2 Cache API

```js
getCached(key)                  // returns value or null if expired
setCache(key, value, ttlMs)     // store with TTL
invalidateCache(key)            // delete one key
invalidateCachePrefix(prefix)   // delete all keys matching prefix
```

All write endpoints for cached resources **must** call `invalidateCachePrefix('resource:')` after a successful write. Failure to do so serves stale data for up to 60 seconds.

### 13.3 Dashboard Summary Optimization

`GET /dashboard/summary` is available without authentication (used by the public homepage stats counter) but is on the `adminLimiter` (500/15 min). It returns aggregated counts and the pinned announcement in a single cached query, avoiding 5 separate table counts.

### 13.4 Root-layout Parallelism

All six public API calls fire simultaneously via `Promise.allSettled`. A slow officer response does not delay the announcement render. Partial failures are tolerated — if any one call fails, the rest still render with the data that succeeded.

### 13.5 Cache Limitations

The cache is per-process. In a horizontally-scaled deployment (multiple backend instances behind a load balancer), each instance has its own cache and write invalidations only clear the local instance's cache. At the current scale of CSG-OITS (single-server deployment), this is acceptable. If the project ever scales to multiple instances, replace `cache.js` with a Redis client — the exported API (`getCached`, `setCache`, `invalidateCache`, `invalidateCachePrefix`) stays identical.

---

## 14. Module Reference

### 14.1 Announcements Module

- **Route file:** `routes/announcements.routes.js`
- **DB table:** `bulletin`
- **Storage bucket:** `bulletin` (`{id}.jpg`)
- **Cache:** None (read from DB directly; officers/committees are cached)
- **Special behavior:** Pin system — only one pinned announcement at a time; `POST /pin` unpins all then sets target
- **Sanitization:** `content` field is sanitized with `sanitizeContent()` before insert

### 14.2 Documents Module

- **Route file:** `routes/documents.routes.js`
- **DB table:** `documents`
- **Storage buckets:** `documents` (PDF), `thumbnails` (PNG preview)
- **Special behavior:** PDF upload triggers the external `PDF_REDACT_URL` microservice for redaction; admin can draw redaction boxes in the `pdf-selector.tsx` UI before submitting
- **Public pagination:** `GET /documents/?page=1&limit=20` supports optional pagination

### 14.3 Events Module

- **Route file:** `routes/events.routes.js`
- **DB table:** `events`
- **Storage bucket:** `events` (up to 3 photos per event at `{id}/image_0.jpg` etc.)
- **Sanitization:** `description` field is sanitized before insert

### 14.4 Officers Module

- **Route file:** `routes/officers.routes.js`
- **DB table:** `officers`
- **Storage bucket:** `officers` (`{id}.jpg`)
- **Cache keys:** `officers:active` (60s), `officers:archived` (60s)
- **Special behavior:**
  - Uses `status` field (`'active'`/`'archived'`) instead of `is_archived`
  - Archive requires `term_year` in request body
  - `GET /officers/terms` returns distinct `term_year` values from archived officers

### 14.5 Committees Module

- **Route file:** `routes/committee.routes.js` (note: singular filename)
- **DB table:** `committees`
- **Cache keys:** `committees:active` (60s), `committees:archived` (60s)
- **Critical rule:** `id` is INTEGER — always `parseInt()` before any query
- **Special behavior:** Inline rename in the admin panel; bulk archive via array of integer IDs

### 14.6 Organizations Module

- **Route file:** `routes/organizations.routes.js`
- **DB table:** `organizations`
- **Storage bucket:** `organizations` (`{id}.jpg`)
- **Cache:** None

### 14.7 Equipment / Borrowing Module

- **Route file:** `routes/borrowing.routes.js` + `routes/equipment.routes.js`
- **DB tables:** `inventory` (items), `borrowing_requests` (requests)
- **Cache key:** `equipment:all` (60s, invalidated on inventory writes)
- **Special behaviors:**
  - Public borrow form supports up to 5 items in one submission (one `borrowing_requests` row per item)
  - Approving a request deducts `quantity` from `inventory`; marking returned restores it
  - Borrow request emails are sent via Nodemailer (`lib/mailer.js`)
  - The `GET /equipment/` route queries the `inventory` table (table name differs from route name)

### 14.8 Dashboard Module

- **Route file:** `routes/dashboard.routes.js`
- **Cache:** `dashboard:summary` (60s), `dashboard:storage` (300s)
- **Data sources:** counts from `bulletin`, `documents`, `events`, `officers` tables; storage from Supabase Management API; pinned announcement from `bulletin` table
- **Note:** `GET /dashboard/summary` has no auth requirement but uses `adminLimiter`

### 14.9 Settings Module

- **Route file:** `routes/settings.routes.js`
- **DB table:** `settings` (key-value)
- **Current keys:** `active_term` — the academic term displayed across public pages
- **Usage:** `Root-layout.tsx` fetches `GET /settings/term` on mount to filter officers by active term

### 14.10 Audit Log Module

- **Route file:** `routes/auditlog.routes.js`
- **DB table:** `audit_logs`
- **Write mechanism:** `auditLogger(action)` middleware wraps `res.json`; fires a fire-and-forget INSERT on 2xx responses
- **Read:** `GET /auditlog/` joins with Supabase Auth `listUsers()` to resolve admin emails
- **Admin panel:** Read-only; filter by today/week/month

### 14.11 User / Auth Module

- **Route file:** `routes/user.routes.js`
- **DB table:** `profiles`, `whitelist`
- **Supabase Auth:** `anonSupabase.auth.signInWithPassword` for login; `supabase.auth.admin.createUser` for registration; `supabase.auth.refreshSession` for token refresh
- **Whitelist:** Uses service key for all operations (RLS protected)

### 14.12 Analytics Module

- **Route file:** `routes/analytics.routes.js`
- **Data:** 6 months of monthly document upload counts, 8 weeks of weekly counts
- **No DB table:** Derived by querying the `documents` table with date grouping

---

## 15. Design System

### 15.1 Token Files

- `frontend/src/styles/tokens.css` — original token set
- `frontend/src/index.css` — Wave 11A tokens (canonical, second `:root` block), global utility classes, Google Fonts imports

Use Wave 11A tokens for all new development. Both sets coexist; Wave 11A overrides overlapping names.

**Rule:** Never hardcode hex colors. Always use CSS custom properties from the token files. (CONTRIBUTING.md Rule F2)

**Exception:** The admin panel uses its own CSS design system (blue sidebar, dark-tone UI) — public tokens should not be applied to admin components.

### 15.2 Core Color Tokens

| Token | Purpose |
|---|---|
| `--color-primary` | Buttons, links, active states |
| `--color-primary-dark` | Button hover |
| `--color-background` | Page background (`#F8F9FF`) |
| `--color-surface` | Card and modal backgrounds |
| `--color-text-primary` | Headings and body text |
| `--color-text-muted` | Captions, labels, placeholders |
| `--color-footer-bg` | Footer background (`#2D3A6B`) |
| `--color-success` / `--color-danger` / `--color-warning` | Semantic state colors |

Full token reference: `docs/design-system.md`

### 15.3 Typography

| Token | Value | Usage |
|---|---|---|
| `--font-stack` | `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` | Body text |
| `--font-serif` | `'Instrument Serif', Georgia, serif` | Decorative italic accents |
| `--font-mono` | `'JetBrains Mono', monospace` | Code blocks |

Font sizes run from `--font-size-xs` (12px) to `--font-size-5xl` (48px).

### 15.4 Key Utility Classes

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` — button variants
- `.card`, `.card-lg` — card containers with hover lifts
- `.tag`, `.tag-update`, `.tag-event`, `.tag-notice`, `.tag-pinned` — announcement category tags
- `.section`, `.section-gradient`, `.section-white` — page section wrappers
- `.modal-backdrop` / `.modal-overlay` — full-screen modal backdrop
- `.italic-accent` — Instrument Serif decorative word emphasis
- `.search-pill` — frosted rounded search input

### 15.5 Approved Pages (Do Not Modify)

Per CONTRIBUTING.md Rule F5, these pages require explicit sign-off from the project lead before any visual changes:
- `/bulletin` (Bulletin.tsx) — reference design for page header + search toolbar + pinned hero card
- `/documents` (Documents.tsx / BulletinDocuments.tsx) — reference design for sidebar filter + grid

---

## 16. Testing Strategy

### 16.1 Test Suite

| Layer | Tool | Location | Command |
|---|---|---|---|
| Backend unit | Vitest | `backend/tests/unit/` | `cd backend && npm test` |
| Backend routes | Vitest + Supertest | `backend/tests/routes/` | `cd backend && npm test` |
| Frontend | Vitest + React Testing Library | `frontend/src/**/__tests__/` | `cd frontend && npm test` |
| E2E | Playwright | `tests/e2e/` | `npx playwright test` |

### 16.2 Backend Unit Tests

| File | Coverage |
|---|---|
| `unit/apiError.test.js` | `ApiError` class construction, `isOperational` flag |
| `unit/cache.test.js` | `getCached`, `setCache`, `invalidateCache`, `invalidateCachePrefix` |
| `unit/sanitize.test.js` | `sanitizeContent()` HTML allowlist behavior |
| `unit/uploadValidation.test.js` | `validateImageUpload`, `validatePdfUpload` — MIME + size errors |

### 16.3 Backend Route Tests

One file per resource covers all endpoints for that module. Tests mock Supabase at the module level via `vi.mock('../lib/supabaseClient.js')`. Tests never hit the real database.

Mock helpers from `backend/tests/mocks/supabase.mock.js`:
- `createQueryChain(resolvedValue)` — chainable mock for Supabase fluent query API
- `mockFromTable(table, data)` — configure per-test return values
- `mockRequireAuth(userId)` — simulate requireAuth passing with a given user ID

### 16.4 E2E Tests

Flows covered with Playwright: admin login, create announcement, move to bin, restore from bin, hard delete, upload document, create officer, archive officer, admin logout.

E2E tests require both dev servers running. They do not run in CI.

### 16.5 Coverage Thresholds

| Target | Lines | Functions | Branches |
|---|---|---|---|
| Backend | 70% | 70% | 60% |
| Frontend | 60% | 60% | 50% |

### 16.6 CI Integration

CI runs on push to `main`/`develop` and PRs targeting `main`:
1. Backend tests — `npm ci && npm test` with dummy Supabase values
2. Frontend tests — `npm ci && npm test`
3. Frontend build — `npm run build` (TypeScript + Vite compilation check)

---

## 17. Development Setup

### 17.1 Prerequisites

| Requirement | Why |
|---|---|
| Node.js ≥ 18 | ESM modules, backend and frontend tooling |
| npm ≥ 9 | Package management |
| mkcert | Local HTTPS certificates — **required** for httpOnly cookie auth |
| Supabase account | Database, Auth, Storage |

HTTPS is required because cookies are set with `secure: true`. Browsers refuse to store or send secure cookies over plain HTTP.

### 17.2 Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd CSG-OITS-Dev
cd backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env   # fill in Supabase keys
cp frontend/.env.example frontend/.env # set VITE_API_URL

# 3. Set up local HTTPS
mkcert -install
mkcert localhost 127.0.0.1 ::1        # generates localhost+2.pem, localhost+2-key.pem

# 4. Run servers
cd backend && npm run dev    # port 3000
cd frontend && npm run dev   # port 5173
```

### 17.3 Environment Variables

**Backend (`backend/.env`):**

```
SUPABASE_URL=https://your-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_MANAGEMENT_TOKEN=sbp_...
PDF_REDACT_URL=http://localhost:8000
FRONTEND_URL=https://localhost:5173
PORT=3000
```

**Frontend (`frontend/.env`):**

```
VITE_API_URL=https://localhost:3000/api/v1
VITE_GITHUB_OWNER=your-github-org
VITE_GITHUB_REPO=CSG-OITS-Dev
```

### 17.4 Database Setup

Run migrations in Supabase SQL Editor in order:
1. `supabase/migrations/001_initial_schema.sql` — base tables
2. `supabase/migrations/002_soft_delete_documents.sql`
3. `supabase/migrations/003_announcement_pinning.sql`
4. `supabase/migrations/004_officers_schema.sql`
5. Manual: `ALTER TABLE committees ADD COLUMN IF NOT EXISTS deleted_at timestamptz;`
6. Manual: `ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS full_name text; ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS student_id text;`

See `docs/local-setup.md` for the full step-by-step guide.

---

## 18. Deployment Architecture

### 18.1 Recommended Production Architecture

```
Students / Admins
       │
       ▼
 Cloudflare (DNS + DDoS + CDN)
       │
  ┌────┴────────────────────┐
  │                         │
  ▼                         ▼
Frontend                  Backend
(Vercel / Netlify /       (Railway / Render /
 Cloudflare Pages)         Fly.io / VPS)
  React SPA                 Express 5 (Node.js)
                                 │
                                 ▼
                          Supabase (PostgreSQL
                           + Auth + Storage)
                                 │
                          PDF Redaction Microservice
                          (Python — separate service)
```

### 18.2 Deployment Steps

1. **Cloudflare:** Add domain, set SSL to "Full (strict)", enable "Always Use HTTPS".
2. **Backend:** Deploy to Railway/Render/Fly.io. Set all env vars. Start command: `node src/server.js`. Verify `GET /health` → 200.
3. **Frontend:** Deploy to Vercel/Netlify. Set root directory to `frontend`. Add SPA rewrite rule (`/* → /index.html`). Set `VITE_API_URL` to production backend URL.
4. **PDF Microservice:** Deploy separately. Set `PDF_REDACT_URL` on backend to its URL.
5. **Supabase:** Set production Site URL and redirect URLs in Auth settings. Confirm RLS on all tables. Verify all 7 storage buckets exist as public.

### 18.3 Production Checklist

Security: all migrations run, RLS enabled, `SUPABASE_SERVICE_KEY` not in frontend, `NODE_ENV=production` set, CORS restricted to production frontend URL.

Performance: rate limiters active, cache active, Cloudflare CDN caching frontend SPA.

Functionality: `/health` returns 200, admin login sets cookies, PDF upload succeeds, borrow form submits, audit log captures actions.

---

## 19. Known Limitations and Future Work

| Item | Severity | Description |
|---|---|---|
| 30-day bin purge not automated | Medium | Items in the Bin are not automatically deleted after 30 days. A Supabase scheduled Edge Function or external cron job would be needed. Currently admins must purge manually. |
| Admin account removal unimplemented | Low | Settings panel shows a Remove button for admin accounts, but the click handler is a `console.log` placeholder. |
| Committees bin view non-functional in production | Medium | The Bin tab exists in the UI, but the `committees.deleted_at` column migration may not have been run in production, making the bin view non-functional. |
| MIME type validation uses client-reported type | Low | Upload validation checks `file.mimetype` (from Multer/Content-Type header), not file magic bytes. A client could theoretically bypass this. |
| In-memory cache not shared across instances | Low | If the backend is deployed to multiple instances, each has its own cache. Cache invalidation only clears the local instance. Redis would be needed for distributed caching. |
| `unsafe-inline` in CSP `styleSrc` | Low | Required because the frontend uses inline styles for dynamic token values and animation state. |
| PDF microservice location | Low | The PDF redaction microservice source (`main.py`) is inside `frontend/src/admin/components/pdf-selector-components/`. It should be extracted to a standalone service directory before production. |
| Admin registration has no permission tier | Medium | Any authenticated admin can create new admins — there is no concept of a super-admin or admin-creation permission. |

---

## 20. Appendix

### 20.1 ADR Summary

| ADR | Title | Key Decision |
|---|---|---|
| [001](decisions/001-supabase-client-strategy.md) | Supabase client selection strategy | Three clients: `anonSupabase` for public reads (RLS enforced), `supabase` service key for admin writes (RLS bypassed), `createUserClient(token)` for user-scoped writes |
| [002](decisions/002-soft-delete-archive-bin.md) | Three-tier content lifecycle | Active → Archive (is_archived=true) → Bin (deleted_at NOT NULL) → hard DELETE. Archive and Bin are separate states. |
| [003](decisions/003-root-layout-data-fetching.md) | Centralized data fetching in Root-layout | All public data fetched in `Root-layout.tsx` via `Promise.allSettled`, passed to children via outlet context. Child routes must not fetch data already in context. |
| [004](decisions/004-committee-integer-pk.md) | Committee table uses INTEGER primary key | `committees.id` is an auto-increment INTEGER. All code must `parseInt()` before querying. Migrating to UUID was judged too risky. |
| [005](decisions/005-in-memory-cache.md) | In-memory response caching without Redis | Simple `Map`-based TTL cache on the backend. Per-process, no Redis dependency. Acceptable at current single-server scale. |

### 20.2 Glossary

| Term | Definition |
|---|---|
| Active | A content record with `is_archived = false` and `deleted_at = NULL`. Visible to the public. |
| Admin panel | The authenticated management interface at `/admin`, rendered by `AdminPage.tsx` and navigated via `?panel=` URL parameter. |
| `adminLimiter` | Express rate limiter: 500 requests per 15 minutes per IP. Applied to `/user`, `/dashboard`, `/settings`, `/analytics`, `/auditlog`, `/borrowing`. |
| ADR | Architecture Decision Record. A short document capturing a significant architectural decision, its context, and consequences. Stored in `docs/decisions/`. |
| Anon key | Supabase project anon/public key. Used by `anonSupabase` client. Subject to Row-Level Security. |
| Archive | Content state: `is_archived = true`, `deleted_at = NULL`. Permanent historical record, visible to admins only. Never auto-purged. |
| `auditLogger` | Express middleware factory that wraps `res.json` to fire a fire-and-forget audit log INSERT on 2xx responses. |
| Bin | Content state: `deleted_at NOT NULL`. Soft-deleted. Recoverable for ~30 days (manual purge only). |
| Bulletin | The database table name for announcements. The public page is at `/bulletin`. |
| Committee | A CSG standing committee. ID is an INTEGER (not UUID) — always `parseInt()`. |
| `createUserClient(token)` | Creates a Supabase client initialized with the user's JWT. Used for user-attributed writes subject to RLS. |
| httpOnly cookie | A browser cookie that cannot be read by JavaScript (`document.cookie`). Prevents XSS from stealing session tokens. |
| Inventory | The database table name for borrowable equipment (route is `/equipment/` but DB table is `inventory`). |
| Outlet context | React Router's mechanism for passing data from a parent route (`Root-layout.tsx`) to child routes via `useOutletContext()`. |
| `publicLimiter` | Express rate limiter: 100 requests per 15 minutes per IP. Applied to announcements, documents, events, officers, committees, equipment, organizations, changelog. |
| `requireAuth` | Express middleware that verifies the `sb_access_token` httpOnly cookie on every protected endpoint. Handles transparent token refresh. |
| RLS | Row-Level Security. PostgreSQL feature that enforces per-row access policies. Enabled on all Supabase tables in this project. |
| Service key | Supabase service role key. Bypasses all RLS. Used only by the `supabase` client in the backend for admin operations. |
| `status` field | Used by `officers` and `committees` tables instead of `is_archived`. Values: `'active'` or `'archived'`. |
| `supabase` | The service-key Supabase client exported from `lib/supabaseClient.js`. Bypasses RLS. Used for admin writes, `auth.admin` calls, storage operations. |
| Term year | Academic year string in format `AY YYYY-YYYY`, e.g., `'AY 2025-2026'`. Used to filter officers and tag content. |
| `validate(schema)` | Express middleware factory wrapping a Zod schema. Parses `req.body` against the schema; replaces `req.body` with the parsed result on success; throws 400 on validation failure. |
| Wave 11A | The canonical design token set defined in the second `:root` block of `frontend/src/index.css`. Takes precedence over the legacy `tokens.css` tokens for new development. |

### 20.3 Related Documentation

| Document | Audience | Description |
|---|---|---|
| [docs/architecture.md](architecture.md) | Developers | System diagram, all request flows, caching and rate limiting detail |
| [docs/api-reference.md](api-reference.md) | Developers | Complete endpoint reference — every route, request body, response shape |
| [docs/database.md](database.md) | Developers | Table schemas, client rules, query patterns, storage buckets |
| [docs/frontend.md](frontend.md) | Developers | Routing, outlet context, component inventory, config functions |
| [docs/admin-guide.md](admin-guide.md) | Admins + Developers | Every admin panel: forms, actions, filters, tabs |
| [docs/auth.md](auth.md) | Developers | Login flow, cookie spec, requireAuth, session expiry, registration |
| [docs/data-lifecycle.md](data-lifecycle.md) | Developers + Admins | Archive/Bin/Delete state transitions, officers variant, 30-day policy |
| [docs/design-system.md](design-system.md) | Frontend Developers | Full token reference, utility classes, approved page designs |
| [docs/local-setup.md](local-setup.md) | Developers | Step-by-step dev environment, mkcert, Supabase setup, migration SQL |
| [docs/deployment.md](deployment.md) | DevOps | Production deployment, env vars, pre-launch checklist |
| [docs/security.md](security.md) | Developers | Security measures, CSP config, known limitations |
| [docs/testing.md](testing.md) | Developers | Test suite, mock infrastructure, CI, coverage thresholds |
| [docs/decisions/](decisions/) | Developers | Architecture Decision Records (ADR 001–005) |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Developers | Critical rules, conventions, must-read before coding |
| [CHANGELOG.md](../CHANGELOG.md) | Everyone | Version history |
