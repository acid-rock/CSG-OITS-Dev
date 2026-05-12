import './adminPanel.css';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
// Layout
import Sidebar from './components/sidebar/Sidebar';
import ContentPanel from './contentPanel/ContentPanel';
import SessionExpiredModal from './components/modals/SessionExpiredModal/SessionExpiredModal';

const DEFAULT_PANEL = 'dashboard';

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get('panel') || DEFAULT_PANEL;
  const [sessionExpired, setSessionExpired] = useState(false);

  const setPanel = (newPanel: string) => setSearchParams({ panel: newPanel });

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setSessionExpired(true);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  return (
    <div className='admin' style={{ display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: '100vh' }}>
      <Sidebar panel={panel} setPanel={setPanel} />
      <ContentPanel active={panel} />
      <SessionExpiredModal isOpen={sessionExpired} />
    </div>
  );
};

export default AdminPage;
