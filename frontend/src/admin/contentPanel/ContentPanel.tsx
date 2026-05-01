import './contenePanel.css';

import Dashboard from '../panel/dashboard/Dashboard';
import Announcement from '../panel/announcement/Announcement';
import Documents from '../panel/documents/Document';
import Contributor from '../panel/contributors/Contributor';
import Audit from '../panel/auditlog/Auditlog';
import Settings from '../panel/settings/Settings';
import Events from '../panel/events/Events';
import OfficersPanel from '../panel/officers/Officers';
import CommitteesPanel from '../panel/committees/Committees';
import Bin from '../../route/bin/Bin';

const panel = [
  { name: 'dashboard',    content: <Dashboard /> },
  { name: 'announcement', content: <Announcement /> },
  { name: 'documents',    content: <Documents /> },
  { name: 'events',       content: <Events /> },
  { name: 'officers',     content: <OfficersPanel /> },
  { name: 'committees',   content: <CommitteesPanel /> },
  { name: 'bin',          content: <Bin /> },
  { name: 'auditlog',     content: <Audit /> },
  { name: 'contributors', content: <Contributor /> },
  { name: 'settings',     content: <Settings /> },
];

const ContentPanel = ({ active }: { active: string | null }) => {
  return (
    <div className='contentPanel-container'>
      {panel.find((p) => p.name === active)?.content}
    </div>
  );
};

export default ContentPanel;
