import './adminPanel.css';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ContentPanel from './contentPanel/ContentPanel';
import SessionExpiredModal from './components/modals/SessionExpiredModal/SessionExpiredModal';

const DEFAULT_PANEL = 'dashboard';

const AdminPage = () => {
  const [searchParams] = useSearchParams();
  const panel = searchParams.get('panel') || DEFAULT_PANEL;
  const [sessionExpired, setSessionExpired] = useState(false);

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
    <div className="ad-root">
      <ContentPanel active={panel} />
      <SessionExpiredModal isOpen={sessionExpired} />
    </div>
  );
};

export default AdminPage;
