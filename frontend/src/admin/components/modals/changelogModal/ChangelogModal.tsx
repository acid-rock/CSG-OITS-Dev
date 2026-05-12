import { useEffect, useState } from 'react';
import { useLockBodyScroll } from '../../../../hooks/useLockBodyScroll';

const API_URL = import.meta.env.VITE_API_URL as string;

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal = ({ isOpen, onClose }: ChangelogModalProps) => {
  useLockBodyScroll(isOpen);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/changelog`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.text();
      })
      .then((text) => setContent(text))
      .catch(() => setError('Could not load changelog.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 680, width: '92%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>System Changelog</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
            aria-label='Close'
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading changelog...</p>}
          {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
          {!loading && !error && content && (
            <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#111827', margin: 0 }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
