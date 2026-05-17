import { buttonConfig } from './dashboard-buttonConfig';
import './sidebar.css';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import SidebarPreview from './SidebarPreview';

type SidebarProps = {
  panel: string;
  setPanel: (id: string) => void;
};

const SECTIONS: { label: string; names: string[] }[] = [
  { label: 'Overview', names: ['dashboard'] },
  { label: 'Content', names: ['announcement', 'documents', 'events', 'officers', 'committees', 'organizations'] },
  { label: 'Operations', names: ['borrowing', 'auditlog', 'contributors', 'settings', 'bin'] },
];

const PREVIEW_PANELS = new Set([
  'announcement', 'documents', 'events', 'officers', 'committees', 'organizations',
]);

const SIDEBAR_WIDTH = 248;

const Sidebar = ({ panel, setPanel }: SidebarProps) => {
  const [adminName, setAdminName] = useState('Admin');
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const [previewTop, setPreviewTop] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/user/me`, { withCredentials: true })
      .then(({ data }) => { if (data.name) setAdminName(data.name); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/user/logout`,
        {},
        { withCredentials: true },
      );
    } finally {
      localStorage.removeItem('admin_authenticated');
      window.location.href = '/admin/login';
    }
  };

  const initials = adminName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const openPreview = (panelKey: string, e: React.MouseEvent) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPreviewTop(rect.top);
    setHoveredPanel(panelKey);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHoveredPanel(null), 150);
  };

  return (
    <div className='sidebar-container'>
      {/* ── Brand ── */}
      <div className='sidebar-top'>
        <div className='sidebar-details'>
          <img src='/CSG_logo.svg' alt='CSG Logo' className='sidebar-logo-img' />
          <div className='sidebar-details-text'>
            <span>Online Information</span>
            <span className='subtitle'>Transparency System</span>
          </div>
        </div>

        {/* ── Welcome block ── */}
        <div className='sidebar-welcome'>
          <div className='sidebar-avatar'>{initials || 'A'}</div>
          <div className='sidebar-status-dot' />
          <span className='sidebar-admin-name'>{adminName}</span>
        </div>

        {/* ── Section-grouped nav ── */}
        <div className='sidebar-buttons'>
          {SECTIONS.map((section) => {
            const sectionButtons = buttonConfig.filter(btn => section.names.includes(btn.name));
            if (sectionButtons.length === 0) return null;
            return (
              <div key={section.label}>
                <div className='sidebar-nav-section'>{section.label}</div>
                {sectionButtons.map((btn, idx) => (
                  <button
                    key={btn.name || idx}
                    className={`sidebar-btn ${panel === btn.name ? 'active' : ''}`}
                    onClick={() => setPanel(btn.name)}
                    onMouseEnter={PREVIEW_PANELS.has(btn.name)
                      ? (e) => openPreview(btn.name, e)
                      : undefined}
                    onMouseLeave={PREVIEW_PANELS.has(btn.name)
                      ? scheduleClose
                      : undefined}
                  >
                    {btn.icon}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Logout ── */}
      <div className='sidebar-logout'>
        <button className='logout-button' onClick={handleLogout}>
          <img src='/logout.png' alt='' />
          Log Out
        </button>
      </div>

      {/* ── Hover preview (portal to body) ── */}
      {hoveredPanel && (
        <SidebarPreview
          panel={hoveredPanel}
          topOffset={previewTop}
          leftOffset={SIDEBAR_WIDTH}
          onMouseEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
          }}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
};

export default Sidebar;
