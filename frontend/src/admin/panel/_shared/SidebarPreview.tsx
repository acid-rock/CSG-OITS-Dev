import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './sidebar-preview.css';

const API_URL = import.meta.env.VITE_API_URL as string;

interface SidebarPreviewProps {
  panel: string;
  topOffset: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PANEL_CONFIG: Record<string, {
  label: string;
  endpoint: string;
  nameField: string;
  dateField: string;
  imgField?: string;
}> = {
  announcement: {
    label: 'Latest Announcements',
    endpoint: '/announcements/',
    nameField: 'title',
    dateField: 'created_at',
    imgField: 'imgUrl',
  },
  documents: {
    label: 'Recent Documents',
    endpoint: '/documents/',
    nameField: 'name',
    dateField: 'created_at',
    imgField: 'thumbnail',
  },
  events: {
    label: 'Recent Events',
    endpoint: '/events/',
    nameField: 'name',
    dateField: 'created_at',
    imgField: 'images',
  },
  officers: {
    label: 'Active Officers',
    endpoint: '/officers/',
    nameField: 'full_name',
    dateField: 'created_at',
    imgField: 'avatar',
  },
  committees: {
    label: 'Committees',
    endpoint: '/committees/',
    nameField: 'name',
    dateField: 'created_at',
  },
  organizations: {
    label: 'Organizations',
    endpoint: '/organizations/',
    nameField: 'name',
    dateField: 'created_at',
    imgField: 'logo_url',
  },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getImg(item: Record<string, unknown>, imgField?: string): string | null {
  if (!imgField) return null;
  const val = item[imgField];
  // events.images is an array
  if (Array.isArray(val)) return (val[0] as string) ?? null;
  return (val as string) ?? null;
}

export default function SidebarPreview({
  panel, topOffset, onMouseEnter, onMouseLeave,
}: SidebarPreviewProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef<Record<string, Record<string, unknown>[]>>({});

  const config = PANEL_CONFIG[panel];

  useEffect(() => {
    if (!config) return;
    if (cache.current[panel]) {
      setItems(cache.current[panel].slice(0, 5));
      setLoading(false);
      return;
    }
    setLoading(true);
    // Public read — no withCredentials needed
    axios.get(`${API_URL}${config.endpoint}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data.slice(0, 5) : [];
        cache.current[panel] = data;
        setItems(data);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [panel, config]);

  if (!config) return null;

  return (
    <div
      className="sidebar-preview"
      style={{ top: Math.max(8, topOffset - 8) }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="sidebar-preview__arrow" />
      <p className="sidebar-preview__label">PUBLIC VIEW</p>
      <p className="sidebar-preview__title">{config.label}</p>
      <div className="sidebar-preview__divider" />

      {loading && <p className="sidebar-preview__empty">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="sidebar-preview__empty">No items yet</p>
      )}
      {!loading && items.map((item, i) => {
        const imgSrc = getImg(item, config.imgField);
        return (
          <div key={(item.id as string) ?? i} className="sidebar-preview__item">
            {imgSrc && (
              <div className="sidebar-preview__thumb">
                <img
                  src={imgSrc}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="sidebar-preview__item-body">
              <p className="sidebar-preview__item-name">
                {String(item[config.nameField] ?? '—')}
              </p>
              <p className="sidebar-preview__item-date">
                {formatDate(String(item[config.dateField] ?? ''))}
              </p>
            </div>
          </div>
        );
      })}
      {items.length === 5 && (
        <p className="sidebar-preview__more">+ more — navigate to see all</p>
      )}
    </div>
  );
}
