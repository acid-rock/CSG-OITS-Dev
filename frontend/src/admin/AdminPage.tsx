import './adminPanel.css';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
// Layout
import Sidebar from './components/sidebar/Sidebar';
import ContentPanel from './contentPanel/ContentPanel';

const DEFAULT_PANEL = 'dashboard';

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelParam = searchParams.get('panel') || DEFAULT_PANEL;

  const [panel, setPanel] = useState(panelParam);
  //state the controls what panel to show

  useEffect(() => {
    setSearchParams({ panel });
  }, [panel]);

  return (
    <div className='admin-panel'>
      <Sidebar panel={panel} setPanel={setPanel} />
      <ContentPanel active={panel} />
    </div>
  );
};

export default AdminPage;
