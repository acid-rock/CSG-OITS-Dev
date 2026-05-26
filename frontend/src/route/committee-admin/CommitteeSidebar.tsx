/**
 * CommitteeSidebar — restricted sidebar for committee admin portal.
 * Shows only the panels the current committee role is allowed to access.
 * Uses the same .ad-sb-* CSS classes as the admin Sidebar for visual consistency.
 */
import { useNavigate } from 'react-router-dom';
import '../../admin/panel/_shared/admin-list.css';
import { I } from '../../admin/panel/_shared/icons';

interface NavLink {
  id: string;
  label: string;
  Icon: React.ComponentType<{ width?: string; height?: string }>;
}

const ALL_LINKS: Record<string, NavLink> = {
  announcement: { id: 'announcement', label: 'Announcements', Icon: I.bell },
  events:       { id: 'events',       label: 'Events',         Icon: I.calendar },
  documents:    { id: 'documents',    label: 'Documents',      Icon: I.doc },
  borrowing:    { id: 'borrowing',    label: 'Equipment',      Icon: I.hdd },
  finance:      { id: 'finance',      label: 'Finance',        Icon: I.trend },
};

const ROLE_LABEL: Record<string, string> = {
  publication: 'Publication Committee',
  secretariat: 'Secretariat Committee',
  finance:     'Finance Committee',
};

interface CommitteeSidebarProps {
  role: string;
  active: string;
  allowedPanels: string[];
  onLogout: () => void;
}

export default function CommitteeSidebar({
  role,
  active,
  allowedPanels,
  onLogout,
}: CommitteeSidebarProps) {
  const navigate = useNavigate();
  const roleLabel = ROLE_LABEL[role] ?? 'Committee';

  // Derive initials from role label
  const initials = roleLabel
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CM';

  const links = allowedPanels.map((id) => ALL_LINKS[id]).filter(Boolean);

  return (
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
          <div className="ad-sb-brand-name">Committee Portal</div>
          <div className="ad-sb-brand-sub">CSG-OITS</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="ad-sb-welcome">
        <span className="ad-sb-avatar">{initials}</span>
        <div className="ad-sb-user">
          <span className="ad-sb-presence" />
          <span className="ad-sb-user-name">{roleLabel}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="ad-sb-nav">
        <div className="ad-sb-group">
          <span className="ad-sb-group-label">My Modules</span>
          {links.map((l) => (
            <button
              key={l.id}
              className={`ad-sb-link${active === l.id ? ' is-active' : ''}`}
              onClick={() => navigate(`/committee/admin?panel=${l.id}`)}
            >
              <l.Icon width="17" height="17" />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Sign out */}
      <button className="ad-sb-logout" onClick={onLogout}>
        <I.logout width="15" height="15" />
        Sign out
      </button>
    </aside>
  );
}
