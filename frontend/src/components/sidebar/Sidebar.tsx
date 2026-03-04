import React from 'react';
import './sidebar.css';
import Typography from '../typography/Typography';
import CSGLogo from '../../assets/CSG_logo.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    MdDashboard, 
    MdAnnouncement, 
    MdDescription, 
    MdPeople, 
    MdHistory, 
    MdSettings,
    MdLogout 
} from 'react-icons/md';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Dashboard', icon: <MdDashboard size={20} />, path: '/adminPanel' },
        { label: 'Announcements', icon: <MdAnnouncement size={20} />, path: '/announcementPanel' },
        { label: 'Documents', icon: <MdDescription size={20} />, path: '/documentPanel' },
        { label: 'Contributors', icon: <MdPeople size={20} />, path: '/contributorPanel' },
        { label: 'Audit Log', icon: <MdHistory size={20} />, path: '/auditlogPanel' },
        { label: 'Settings', icon: <MdSettings size={20} />, path: '/settingsPanel' },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleLogout = () => {
        navigate('/bin');
    };

    return (
        <aside className="sidebar-container">
            <div className='sidebar-header'>               
                <img src={CSGLogo} alt="CSG Logo" className="sidebar-logo" />
                <div className='sidebar-title'>
                    <Typography size='text-sm' color='text-dark'>
                        <b>Online Information</b>
                    </Typography>
                    <Typography size='text-xs' color='text-ghost'>
                        Transparency System
                    </Typography>
                </div>
            </div>

            <nav className='sidebar-content'>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button 
                            key={item.label}
                            className={`nav-button ${isActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <Typography size='text-sm' color='text-dark' >
                                {item.label}
                            </Typography>
                        </button>
                    );
                })}
            </nav>

            <div className='sidebar-footer'>
                <div className='welcome-admin'>
                    <Typography size='text-md' color='text-dark'>
                        Welcome Admin
                    </Typography>
                </div>
                <button className='logout-button' onClick={handleLogout}>
                    <MdLogout size={18} />
                    <Typography size='text-sm' color='text-ghost'>Log Out</Typography>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;