import { buttonConfig } from './dashboard-buttonConfig';
import './sidebar.css';
import axios from 'axios';
import { useState, useEffect } from 'react';

type SidebarProps = {
  panel: string;
  setPanel: (id: string) => void;
};

// Map each button to its nav section (Overview / Content / Operations)
const SECTIONS: { label: string; names: string[] }[] = [
  { label: 'Overview', names: ['dashboard'] },
  { label: 'Content', names: ['announcement', 'documents', 'events', 'officers', 'committees', 'organizations'] },
  { label: 'Operations', names: ['borrowing', 'auditlog', 'contributors', 'settings', 'bin'] },
];

const Sidebar = ({ panel, setPanel }: SidebarProps) => {
  const [adminName, setAdminName] = useState('Admin');

  // SOURCE A: fetch admin name from API — preserved exactly
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/user/me`, { withCredentials: true })
      .then(({ data }) => {
        if (data.name) setAdminName(data.name);
      })
      .catch(() => {
        // Fallback: keep 'Admin'
      });
  }, []);

  // SOURCE A: correct logout — calls API, clears localStorage, redirects — preserved exactly
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

  // Derive initials from adminName for the avatar circle
  const initials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className='sidebar-container'>
      {/* ── Brand ── */}
      <div className='sidebar-top'>
        <div className='sidebar-details'>
          <img
            src='/CSG_logo.svg'
            alt='CSG Logo'
            className='sidebar-logo-img'
          />
          <div className='sidebar-details-text'>
            <span>Online Information</span>
            <span className='subtitle'>Transparency System</span>
          </div>
        </div>

        {/* ── Welcome block (SOURCE B addition) ── */}
        <div className='sidebar-welcome'>
          <div className='sidebar-avatar'>{initials || 'A'}</div>
          <div className='sidebar-status-dot' />
          <span className='sidebar-admin-name'>{adminName}</span>
        </div>

        {/* ── Section-grouped nav (SOURCE B structure, SOURCE A handlers) ── */}
        <div className='sidebar-buttons'>
          {SECTIONS.map((section) => {
            const sectionButtons = buttonConfig.filter((btn) =>
              section.names.includes(btn.name),
            );
            if (sectionButtons.length === 0) return null;
            return (
              <div key={section.label}>
                <div className='sidebar-nav-section'>{section.label}</div>
                {sectionButtons.map((btn, idx) => (
                  <button
                    key={btn.name || idx}
                    className={`sidebar-btn ${panel === btn.name ? 'active' : ''}`}
                    onClick={() => setPanel(btn.name)}
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
    </div>
  );
};

export default Sidebar;
