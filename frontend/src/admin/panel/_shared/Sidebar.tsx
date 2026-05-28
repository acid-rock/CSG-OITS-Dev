/**
 * CANONICAL ADMIN SIDEBAR — AY 2025-2026
 * All admin panels must use this sidebar.
 * See: frontend/src/admin/README.md for the panel routing pattern.
 * DO NOT create a second sidebar component.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { I } from './icons';
import SidebarPreview from './SidebarPreview';
import { useTheme } from '../../../hooks/useTheme';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

interface SidebarProps {
  active: string;
}

const GROUPS = [
  { label: 'Overview', links: [
    { id: 'dashboard',     label: 'Dashboard',     Icon: I.trend,    preview: false },
  ]},
  { label: 'Content', links: [
    { id: 'announcement',  label: 'Announcements', Icon: I.bell,     preview: true  },
    { id: 'documents',     label: 'Documents',     Icon: I.doc,      preview: true  },
    { id: 'events',        label: 'Events',        Icon: I.calendar, preview: true  },
    { id: 'officers',      label: 'Officers',      Icon: I.users,    preview: true  },
    { id: 'committees',    label: 'Committees',    Icon: I.users,    preview: true  },
    { id: 'organizations', label: 'Organizations', Icon: I.users,    preview: true  },
  ]},
  { label: 'Operations', links: [
    { id: 'logbook',       label: 'Office Duty',   Icon: I.duty,     preview: false },
    { id: 'borrowing',     label: 'Equipment',     Icon: I.hdd,      preview: false },
    { id: 'finance',       label: 'Finance',       Icon: I.trend,    preview: false },
    { id: 'auditlog',      label: 'Audit Log',     Icon: I.log,      preview: false },
    { id: 'contributors',  label: 'Contributors',  Icon: I.users,    preview: false },
    { id: 'settings',      label: 'Settings',      Icon: I.settings, preview: false },
    { id: 'bin',           label: 'Bin',           Icon: I.bin,      preview: false },
  ]},
];

const ADMIN_NAME_CACHE_KEY = 'csg_admin_name';

export default function Sidebar({ active }: SidebarProps) {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [adminName, setAdminName] = useState<string>(
    () => localStorage.getItem(ADMIN_NAME_CACHE_KEY) ?? 'Admin'
  );

  /* ── Hover preview state ── */
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const [previewTop, setPreviewTop] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (localStorage.getItem(ADMIN_NAME_CACHE_KEY)) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}/user/me`, { withCredentials: true })
      .then(({ data }) => {
        const name = data?.name ?? data?.full_name ?? 'Admin';
        setAdminName(name);
        localStorage.setItem(ADMIN_NAME_CACHE_KEY, name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  const initials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/user/logout`,
        {},
        { withCredentials: true },
      );
    } finally {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem(ADMIN_NAME_CACHE_KEY);
      window.location.href = '/admin/login';
    }
  };

  /* ── Hover handlers — 150ms close delay prevents gap-flicker ── */
  const handleNavMouseEnter = (panelId: string) => (e: React.MouseEvent) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPreviewTop(rect.top);
    setHoveredPanel(panelId);
  };
  const handleNavMouseLeave = () => {
    closeTimer.current = setTimeout(() => setHoveredPanel(null), 150);
  };
  const handlePreviewMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const handlePreviewMouseLeave = () => {
    closeTimer.current = setTimeout(() => setHoveredPanel(null), 150);
  };

  return (
    <>
      <aside className="ad-sidebar">
        {/* Brand */}
        <div className="ad-sb-brand">
          <span className="ad-sb-logo">
            <img
              src="/CSG_logo.svg"
              alt="CSG OITS"
              width="36"
              height="36"
              style={{ borderRadius: '50%', display: 'block' }}
            />
          </span>
          <div className="ad-sb-brand-text">
            <div className="ad-sb-brand-name">Online Information</div>
            <div className="ad-sb-brand-sub">Transparency System</div>
          </div>
        </div>

        {/* Welcome */}
        <div className="ad-sb-welcome">
          <span className="ad-sb-avatar">{initials}</span>
          <div className="ad-sb-user">
            <span className="ad-sb-presence" />
            <span className="ad-sb-user-name">{adminName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="ad-sb-nav">
          {GROUPS.map((g) => (
            <div key={g.label} className="ad-sb-group">
              <span className="ad-sb-group-label">{g.label}</span>
              {g.links.map((l) => (
                <button
                  key={l.id}
                  className={`ad-sb-link${active === l.id ? ' is-active' : ''}`}
                  onClick={() => navigate(`/admin?panel=${l.id}`)}
                  onMouseEnter={l.preview ? handleNavMouseEnter(l.id) : undefined}
                  onMouseLeave={l.preview ? handleNavMouseLeave : undefined}
                >
                  <l.Icon width="17" height="17" />
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Theme toggle */}
        <button className="ad-sb-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* Logout */}
        <button className="ad-sb-logout" onClick={handleLogout}>
          <I.logout width="15" height="15" />
          Log out
        </button>
      </aside>

      {/* Preview renders outside aside so it's never clipped by overflow */}
      {hoveredPanel && (
        <SidebarPreview
          panel={hoveredPanel}
          topOffset={previewTop}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        />
      )}
    </>
  );
}
