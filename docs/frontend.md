# Frontend Architecture

**Framework:** React 19.2.0, TypeScript 5.9.3, Vite 7.2.2, React Router DOM 7.10.1

---

## Application structure

```
frontend/src/
├── main.tsx                      # Router definition — all routes declared here
├── index.css                     # Global base styles + all utility classes
├── styles/
│   └── tokens.css                # Design system tokens (ALWAYS use these)
├── root-layout/
│   └── Root-layout.tsx           # Fetches all public data, passes via outlet context
├── route/                        # Page-level route components
│   ├── homepage/App.tsx          # Homepage (/)
│   ├── bulletin/Bulletin.tsx     # Announcements (/bulletin)
│   ├── documents/Documents.tsx   # Documents (/documents)
│   ├── events/Events.tsx         # Events (/events)
│   ├── officers/Officers.tsx     # Officers (/officers)
│   ├── about/AboutPage.tsx       # About (/about)
│   ├── borrow/Borrow.tsx         # Equipment borrow (/borrow)
│   ├── contributors/Contributors.tsx  # Team (/contributors)
│   └── bin/Bin.tsx               # Admin bin (/admin?panel=bin, redirected)
├── layout/                       # Homepage section components
│   ├── main-section/Main.tsx     # Hero section with live stats
│   ├── announcement-section/Announcement.tsx  # Latest announcements strip
│   ├── events-section/events.tsx # Latest events with pagination
│   ├── officer-layout/Officer.tsx # Officer preview grid
│   ├── about-section/About.tsx   # About section (static)
│   └── document-section/BulletinDocuments.tsx  # Full documents page layout
├── components/                   # Shared UI components
│   ├── navigation/Navigation.tsx # Top navbar
│   ├── footer/Footer.tsx         # Site footer with policy modals
│   ├── modal/Modal.tsx           # Announcement / event detail modal
│   ├── DocumentModal/DocumentModal.tsx  # PDF viewer modal
│   └── search-filter-bar/SearchFilterBar.tsx  # Reusable search + term filter
├── config/                       # Axios fetch functions
│   ├── axiosInstance.ts          # Axios instance (baseURL from VITE_API_URL)
│   ├── bulletinConfig.ts         # fetchBulletinData()
│   ├── documentsConfig.ts        # fetchDocuments()
│   ├── eventConfig.ts            # fetchEvents()
│   ├── officerConfig.ts          # fetchOfficers()
│   └── committeeConfig.ts        # fetchCommittees()
├── hooks/
│   └── useLockBodyScroll.ts      # Locks body scroll when modal is open
└── admin/                        # Entire admin panel (see docs/admin-guide.md)
```

---

## Routing

All routes are defined in `frontend/src/main.tsx`.

| Path | Component | Layout | Access | Description |
|---|---|---|---|---|
| `/` | `App.tsx` | `RootLayout` | Public | Homepage with all sections |
| `/bulletin` | `Bulletin.tsx` | `RootLayout` | Public | Full announcements page |
| `/documents` | `Documents.tsx` | `RootLayout` | Public | Full documents page |
| `/events` | `Events.tsx` | `RootLayout` | Public | Full events page |
| `/about` | `AboutPage.tsx` | `RootLayout` | Public | About CSG page |
| `/officers` | `Officers.tsx` | `RootLayout` | Public | Officer roster + committees |
| `/borrow` | `Borrow.tsx` | `RootLayout` | Public | Equipment borrow form |
| `/contributors` | `Contributors.tsx` | `RootLayout` | Public | Dev team credits |
| `/admin` | `AdminPage.tsx` | `ProtectedRoute` | Auth required | Admin panel shell |
| `/admin/login` | `Login.tsx` | None | Public | Login page |
| `/admin/forgot-password` | `Forgot.tsx` | None | Public | Forgot password |
| `/admin/reset-password` | `Reset.tsx` | None | Public | Reset password |
| `/bin` | — | — | — | Redirects to `/admin?panel=bin` |

`RootLayout` = `Root-layout.tsx` wraps all public routes with the data context.
`ProtectedRoute` = checks `localStorage.getItem('admin_authenticated')` before rendering `AdminPage`.

---

## Data fetching pattern — outlet context

`Root-layout.tsx` is the single data-fetch layer for all public pages. It fires all API calls in parallel using `Promise.allSettled` before rendering any child route, then passes results down via React Router's `<Outlet context={...}>`.

### What it fetches

```tsx
// Root-layout.tsx — parallel fetch on mount
const [settingsResult, bulletinResult, docsResult, eventsResult, officersResult, orgsResult] =
  await Promise.allSettled([
    axios.get('/settings/term'),          // → activeTerm
    fetchBulletinData(),                   // → bulletin[]
    fetchDocuments(),                      // → documents[]
    fetchEvents(),                         // → events[]
    fetchOfficers(activeTerm),             // → officers[] (filtered by term if set)
    axios.get('/organizations/'),          // → organizations[]
  ]);
```

`Promise.allSettled` means partial failures are tolerated — if one API call fails, the others still render. A full error state is only shown if all primary fetches fail.

### OutletContextType shape

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

### Child component consumption

```tsx
import { useOutletContext } from 'react-router-dom';

const { bulletin, documents, events, officers, organizations } =
  useOutletContext<OutletContextType>();
```

Child routes that need data beyond the outlet context (e.g., Officers fetching committees) make their own direct `axios.get()` calls inside `useEffect`.

---

## Component inventory

### Navigation (`components/navigation/Navigation.tsx`)

**Props:** none (reads location from React Router)

**Renders:**
- Logo + brand name (left)
- Desktop dropdown groups: News (Announcements, Events), Resources (Documents, Borrow Equipment), About (About, Officers, Organizations, Contributors)
- Mobile hamburger menu with accordion groups
- Active link highlighting via `NavLink` `isActive`

---

### Footer (`components/footer/Footer.tsx`)

**Props:** none

**Renders:**
- Contact link (Gmail window.open)
- Privacy Policy modal (static content)
- Transparency/Terms modal (static content)
- Cookie Settings modal (static content)
- Facebook external link
- Send Feedback link (Google Form)

---

### Modal (`components/modal/Modal.tsx`)

**Props:**
```tsx
{
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  imageSrc: string;
  imageAlt: string;
  date: string;
  title: string;
  description: string;
  type?: 'event';
  extraImage?: string[];
  currentIndex?: number;
}
```

Used for announcements and events. For events, shows prev/next arrows + dot indicators with 350 ms slide transition. Closes on backdrop click.

---

### DocumentModal (`components/DocumentModal/DocumentModal.tsx`)

**Props:** `{ selected: { title, date, memoSrc }, onClose: () => void }`

Renders an `<iframe>` with the PDF URL. Uses `useLockBodyScroll` hook.

---

### SearchFilterBar (`components/search-filter-bar/SearchFilterBar.tsx`)

**Props:**
```tsx
{
  searchValue: string;
  onSearchChange: (v: string) => void;
  termValue?: string;
  onTermChange?: (v: string) => void;
  termOptions?: string[];
  searchPlaceholder?: string;
  showTermFilter?: boolean;  // default: true
}
```

Reusable toolbar used on `/bulletin`, `/events`, `/officers`, `/borrow`.

---

### useLockBodyScroll (`hooks/useLockBodyScroll.ts`)

Hook that sets `document.body.style.overflow = 'hidden'` while a modal is open. Restores the original value on cleanup. Used in all modal components.

---

## Admin panel routing

The admin panel is a single route (`/admin`) that renders `AdminPage.tsx`. Internal navigation is driven by the `?panel=` URL query parameter — no additional routes.

`ContentPanel.tsx` reads `useSearchParams()` and conditionally renders the matching panel component:

| `?panel=` value | Component rendered |
|---|---|
| `dashboard` (default) | `Dashboard.tsx` |
| `announcement` | `Announcement.tsx` |
| `documents` | `Document.tsx` |
| `events` | `Events.tsx` |
| `officers` | `Officers.tsx` |
| `committees` | `Committees.tsx` |
| `organizations` | `Organizations.tsx` |
| `borrowing` | `Borrowing.tsx` |
| `auditlog` | `Auditlog.tsx` |
| `contributors` | `Contributor.tsx` |
| `settings` | `Settings.tsx` |
| `bin` | `Bin.tsx` |

The sidebar's `dashboard-buttonConfig.tsx` defines the button labels and their corresponding `?panel=` values. Clicking a button calls `setSearchParams({ panel: 'name' })`.

---

## State management

No Redux, Zustand, or other global state library is used.

| Pattern | Where used |
|---|---|
| `useState` per component | All admin panels manage their own `data`, `loading`, `error`, `tab`, `filter`, `sort`, `selectedIds` state |
| `useOutletContext` | Public pages consume pre-fetched data from Root-layout |
| `useCallback` + `useEffect` | Admin panels use `fetchData = useCallback(...)` and call it in `useEffect([fetchData])` |
| `onSuccess` callback | After any write, components call `onSuccess?.()` which triggers `fetchData()` to re-fetch |
| No `window.location.reload()` | State is updated directly after writes — CONTRIBUTING.md Rule F1 |

---

## Key config files

### `config/axiosInstance.ts`

```ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default axiosInstance;
```

All admin panel API calls use `withCredentials: true` to include the httpOnly cookie automatically.

### `config/bulletinConfig.ts`

`fetchBulletinData()` — calls `GET /announcements/`, formats dates to "Mon DD, YYYY", returns `Announcement[]`.

### `config/documentsConfig.ts`

`fetchDocuments(page?, limit?)` — calls `GET /documents` with optional pagination. Returns flat array or `{ data, total, page, limit }`.

### `config/eventConfig.ts`

`fetchEvents()` — calls `GET /events/`, formats dates, returns `Event[]`.

### `config/officerConfig.ts`

`fetchOfficers(page?, limit?, term?)` — calls `GET /officers` with optional filters.

### `config/committeeConfig.ts`

`fetchCommittees()` — calls `GET /committees/`, returns `Committee[]`.
