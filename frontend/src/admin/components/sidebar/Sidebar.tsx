import { buttonConfig } from './dashboard-buttonConfig';
import './sidebar.css';
import axios from 'axios';

type SidebarProps = {
  panel: string;
  setPanel: (id: string) => void;
};

const Sidebar = ({ panel, setPanel }: SidebarProps) => {
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

  return (
    <div className='sidebar-container'>
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
        <div className='sidebar-buttons'>
          {buttonConfig.map((btn, idx) => (
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
      </div>
      <div className='sidebar-logout'>
        <h4>Welcome Admin</h4>
        <button className='logout-button' onClick={handleLogout}>
          <img src='/logout.png' alt='' />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
