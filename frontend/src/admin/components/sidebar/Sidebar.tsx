import { buttonConfig } from './dashboard-buttonConfig';
import './sidebar.css';

type SidebarProps = {
  panel: string;
  setPanel: (id: string) => void;
};

const Sidebar = ({ panel, setPanel }: SidebarProps) => {
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
        <button className='logout-button'>
          <img src='/logout.png' alt='' />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
