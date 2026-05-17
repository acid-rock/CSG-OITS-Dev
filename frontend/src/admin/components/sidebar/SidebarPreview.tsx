import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import fetchBulletinData from '../../../config/bulletinConfig';
import fetchDocuments from '../../../config/documentsConfig';
import fetchEvents from '../../../config/eventConfig';
import fetchOfficers from '../../../config/officerConfig';
import { fetchOrganizations } from '../../../config/organizationsConfig';
import './SidebarPreview.css';

const API_URL = import.meta.env.VITE_API_URL as string;

interface SidebarPreviewProps {
  panel: string;
  topOffset: number;
  leftOffset: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PANEL_LABELS: Record<string, string> = {
  announcement: 'Announcements',
  documents: 'Documents',
  events: 'Events',
  officers: 'Officers',
  committees: 'Committees',
  organizations: 'Organizations',
};

const PANEL_LIMIT: Record<string, number> = {
  announcement: 3,
  documents: 3,
  events: 2,
  officers: 4,
  committees: 4,
  organizations: 4,
};

function getInitials(name: string): string {
  return (name ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

async function fetchDataForPanel(panel: string): Promise<unknown[]> {
  switch (panel) {
    case 'announcement': {
      const d = await fetchBulletinData();
      return Array.isArray(d) ? d : [];
    }
    case 'documents': {
      const d = await fetchDocuments();
      return Array.isArray(d) ? d : (d as { data: unknown[] }).data ?? [];
    }
    case 'events': {
      const d = await fetchEvents();
      return Array.isArray(d) ? d : [];
    }
    case 'officers': {
      const d = await fetchOfficers();
      return Array.isArray(d) ? d : [];
    }
    case 'committees': {
      const { data } = await axios.get(`${API_URL}/committees`);
      return Array.isArray(data) ? data : [];
    }
    case 'organizations': {
      const d = await fetchOrganizations();
      return Array.isArray(d) ? d : [];
    }
    default:
      return [];
  }
}

function renderItems(panel: string, items: unknown[]) {
  if (panel === 'announcement') {
    return (items as { id: string; title: string; imgUrl: string; date: string }[]).map(item => (
      <div key={item.id} className='sp-item'>
        {item.imgUrl && (
          <img src={item.imgUrl} alt={item.title} className='sp-item-img' />
        )}
        <div className='sp-item-body'>
          <p className='sp-item-title'>{item.title}</p>
          <p className='sp-item-date'>{item.date}</p>
        </div>
      </div>
    ));
  }

  if (panel === 'documents') {
    return (items as { id: string; name: string; description: string; category: string }[]).map(item => (
      <div key={item.id} className='sp-item'>
        <span className='sp-item-icon'>📄</span>
        <div className='sp-item-body'>
          <p className='sp-item-title'>{item.description || item.name}</p>
          <p className='sp-item-date'>{item.category}</p>
        </div>
      </div>
    ));
  }

  if (panel === 'events') {
    return (items as { id: string; name: string; images: string[]; date: string }[]).map(item => (
      <div key={item.id} className='sp-item'>
        {item.images?.[0] && (
          <img src={item.images[0]} alt={item.name} className='sp-item-img' />
        )}
        <div className='sp-item-body'>
          <p className='sp-item-title'>{item.name}</p>
          <p className='sp-item-date'>{item.date}</p>
        </div>
      </div>
    ));
  }

  if (panel === 'officers') {
    return (
      <div className='sp-officer-grid'>
        {(items as { id: string; full_name: string; avatar: string }[]).map(o => (
          <div key={o.id} className='sp-officer-item'>
            {o.avatar ? (
              <img src={o.avatar} alt={o.full_name} className='sp-officer-avatar' />
            ) : (
              <div className='sp-officer-initials'>{getInitials(o.full_name)}</div>
            )}
            <p className='sp-officer-name'>{(o.full_name ?? '').split(' ')[0]}</p>
          </div>
        ))}
      </div>
    );
  }

  if (panel === 'committees') {
    return (items as { id: number; name: string }[]).map(item => (
      <div key={item.id} className='sp-name-item'>
        <p>{item.name}</p>
      </div>
    ));
  }

  if (panel === 'organizations') {
    return (items as { id: string; name: string; logo_url: string | null }[]).map(item => (
      <div key={item.id} className='sp-item'>
        {item.logo_url && (
          <img src={item.logo_url} alt={item.name} className='sp-item-img sp-item-img--round' />
        )}
        <div className='sp-item-body'>
          <p className='sp-item-title'>{item.name}</p>
        </div>
      </div>
    ));
  }

  return null;
}

export default function SidebarPreview({
  panel,
  topOffset,
  leftOffset,
  onMouseEnter,
  onMouseLeave,
}: SidebarPreviewProps) {
  const [previewData, setPreviewData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef<Record<string, unknown[]>>({});

  useEffect(() => {
    if (cache.current[panel]) {
      setPreviewData(cache.current[panel]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDataForPanel(panel)
      .then(data => {
        cache.current[panel] = data;
        setPreviewData(data);
      })
      .catch(() => setPreviewData([]))
      .finally(() => setLoading(false));
  }, [panel]);

  const limit = PANEL_LIMIT[panel] ?? 3;
  const shown = previewData.slice(0, limit);
  const remaining = previewData.length > limit ? previewData.length - limit : 0;

  const maxTop = window.innerHeight - 520;

  return createPortal(
    <div
      className='sidebar-preview'
      style={{ top: Math.min(Math.max(8, topOffset), maxTop), left: leftOffset + 8 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className='sidebar-preview-arrow' />
      <p className='sidebar-preview-label'>PUBLIC VIEW</p>
      <p className='sidebar-preview-section'>{PANEL_LABELS[panel] ?? panel}</p>
      <div className='sidebar-preview-divider' />

      {loading ? (
        <p className='sidebar-preview-empty'>Loading...</p>
      ) : shown.length === 0 ? (
        <p className='sidebar-preview-empty'>No items yet</p>
      ) : (
        <>
          {renderItems(panel, shown)}
          {remaining > 0 && (
            <p className='sidebar-preview-more'>
              + {remaining} more — view all in admin panel
            </p>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
