/**
 * CommitteeAdminPage — the committee portal at /committee/admin
 *
 * Renders CommitteeSidebar alongside the existing admin panel component
 * for the active panel. The embedded admin Sidebar inside each panel
 * is hidden via CSS (.ca-panel-host .ad-sidebar { display: none }).
 *
 * Role → allowed panels mapping:
 *   publication  → announcement, events
 *   secretariat  → documents
 *   finance      → borrowing, finance
 */
import { useSearchParams, useNavigate } from 'react-router-dom';
import CommitteeSidebar from './CommitteeSidebar';
import './committee-admin.css';

/* Lazy-import admin panel components so the committee bundle stays lean */
import AnnouncementPanel from '../../admin/panel/announcement/Announcement';
import EventsPanel       from '../../admin/panel/events/Events';
import DocumentsPanel    from '../../admin/panel/documents/Document';
import BorrowingPanel    from '../../admin/panel/borrowing/Borrowing';
import FinancePanel      from '../../admin/panel/finance/Finance';

const ROLE_PANELS: Record<string, string[]> = {
  publication: ['announcement', 'events'],
  secretariat: ['documents'],
  finance:     ['borrowing', 'finance'],
};

type PanelId = 'announcement' | 'events' | 'documents' | 'borrowing' | 'finance';

const PANEL_MAP: Record<PanelId, React.ComponentType> = {
  announcement: AnnouncementPanel,
  events:       EventsPanel,
  documents:    DocumentsPanel,
  borrowing:    BorrowingPanel,
  finance:      FinancePanel,
};

export default function CommitteeAdminPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role          = sessionStorage.getItem('committee_role') ?? '';
  const allowedPanels = ROLE_PANELS[role] ?? [];

  /* Clamp the requested panel to allowed panels for this role */
  const rawPanel = searchParams.get('panel') ?? '';
  const panel    = allowedPanels.includes(rawPanel)
    ? rawPanel
    : allowedPanels[0] ?? '';

  const PanelComponent = PANEL_MAP[panel as PanelId] ?? null;

  const handleLogout = () => {
    sessionStorage.removeItem('committee_role');
    sessionStorage.removeItem('committee_label');
    sessionStorage.removeItem('committee_session');
    navigate('/committee/login');
  };

  return (
    <div className="ca-root">
      <CommitteeSidebar
        role={role}
        active={panel}
        allowedPanels={allowedPanels}
        onLogout={handleLogout}
      />

      <div className="ca-panel-host">
        {PanelComponent ? (
          <PanelComponent />
        ) : (
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <p>No panels available for this role.</p>
          </main>
        )}
      </div>
    </div>
  );
}
