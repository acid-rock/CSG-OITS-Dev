# Admin Sidebar — JSX additions

Restructure the sidebar to add the welcome block and section-grouped nav. The existing `src/admin/components/sidebar/Sidebar.tsx` is the file to edit.

## Target structure

```tsx
import "./sidebar.css"; // or wherever your styles import — adminPanel.css now owns these classes
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, FileText, Calendar, Users,
  Package, ScrollText, Settings, LogOut,
} from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, path: "/admin/dashboard" },
    ],
  },
  {
    section: "Content",
    items: [
      { key: "announcements", label: "Announcements", icon: <Megaphone size={14} />, path: "/admin/announcements", badge: 4 },
      { key: "documents",     label: "Documents",     icon: <FileText  size={14} />, path: "/admin/documents" },
      { key: "events",        label: "Events",        icon: <Calendar  size={14} />, path: "/admin/events" },
      { key: "officers",      label: "Officers",      icon: <Users     size={14} />, path: "/admin/officers" },
    ],
  },
  {
    section: "Operations",
    items: [
      { key: "borrowing", label: "Borrowing", icon: <Package    size={14} />, path: "/admin/borrowing", badge: 2 },
      { key: "audit",     label: "Audit Log", icon: <ScrollText size={14} />, path: "/admin/audit" },
      { key: "settings",  label: "Settings",  icon: <Settings   size={14} />, path: "/admin/settings" },
    ],
  },
];

export default function Sidebar({ user }: { user: { name: string; role: string; initials: string } }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="admin-brand">
        <div className="logo">C</div>
        <div className="admin-brand-text">
          <div className="admin-brand-name">CSG-OITS</div>
          <div className="admin-brand-sub">Admin Console</div>
        </div>
      </div>

      {/* Welcome block */}
      <div className="admin-welcome">
        <div className="admin-avatar">{user.initials}</div>
        <div className="admin-welcome-text">
          <div className="hi">Hi, {user.name.split(" ")[0]}</div>
          <div className="role">{user.role}</div>
        </div>
        <div className="admin-status-dot" />
      </div>

      {/* Section-grouped nav */}
      <nav className="admin-nav">
        {NAV.map(sec => (
          <div key={sec.section}>
            <div className="admin-nav-section">{sec.section}</div>
            {sec.items.map(item => (
              <button
                key={item.key}
                type="button"
                className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
                {item.badge != null && <span className="admin-nav-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <button
        type="button"
        className="admin-logout"
        onClick={() => navigate("/admin/login")}
      >
        ← Exit to Public Site
      </button>
    </aside>
  );
}
```

## In `src/admin/AdminPage.tsx`

Wrap the page in `.admin` and pass user data to `<Sidebar>`:

```tsx
return (
  <div className="admin">
    <Sidebar user={{ name: "Adrianne Salvador", role: "Super Admin", initials: "AS" }} />
    <main className="admin-content">
      <Outlet /> {/* or your tab switcher */}
    </main>
  </div>
);
```

## Dashboard tab shape (for reference)

```tsx
<div className="admin-bar">
  <div>
    <h1>Good morning, <em>Adrianne</em></h1>
    <div className="sub">Here's what's happening across CSG-OITS today</div>
  </div>
  <button className="btn-primary">+ New Announcement</button>
</div>

<div className="admin-stats">
  {stats.map(s => (
    <div key={s.label} className="stat-card">
      <div className="stat-icon">{s.icon}</div>
      <div className="stat-label">{s.label}</div>
      <div className="stat-num">{s.value}</div>
      <div className={`stat-delta ${s.trend ?? ""}`}>{s.delta}</div>
    </div>
  ))}
</div>

<div className="admin-panel">
  <div className="admin-panel-head">
    <div>
      <h2>Recent Borrow Requests</h2>
      <div className="panel-sub">Approve or reject pending requests inline</div>
    </div>
    <button className="btn-secondary">View all</button>
  </div>
  <table className="admin-table"> ... </table>
</div>
```
