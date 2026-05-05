import './adminPanel.css';
import { useSearchParams } from 'react-router-dom';
// Layout
import Sidebar from './components/sidebar/Sidebar';
import ContentPanel from './contentPanel/ContentPanel';

const DEFAULT_PANEL = 'dashboard';

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get('panel') || DEFAULT_PANEL;

  const setPanel = (newPanel: string) => setSearchParams({ panel: newPanel });

  return (
    <div className='admin' style={{ display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: '100vh' }}>
      <Sidebar panel={panel} setPanel={setPanel} />
      <ContentPanel active={panel} />
    </div>
  );
};

export default AdminPage;
