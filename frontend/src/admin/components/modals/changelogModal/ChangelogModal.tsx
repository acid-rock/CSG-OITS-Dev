import { useEffect, useState } from 'react';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal = ({ isOpen, onClose }: ChangelogModalProps) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owner = import.meta.env.VITE_GITHUB_OWNER as string | undefined;
  const repo = import.meta.env.VITE_GITHUB_REPO as string | undefined;

  useEffect(() => {
    if (!isOpen) return;

    if (!owner || !repo) {
      setError('Repository not configured. Set VITE_GITHUB_OWNER and VITE_GITHUB_REPO in your .env file.');
      return;
    }

    setLoading(true);
    setError(null);
    setCommits([]);

    fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
        return res.json();
      })
      .then((data: Commit[]) => setCommits(data))
      .catch(() =>
        setError('Could not load changelog. Check your internet connection or verify the repository is public.'),
      )
      .finally(() => setLoading(false));
  }, [isOpen, owner, repo]);

  if (!isOpen) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 560, width: '92%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading changelog...</p>}
          {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
          {!loading && !error && commits.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No commits found.</p>
          )}
          {commits.map((c) => (
            <div
              key={c.sha}
              style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <p style={{ margin: '0 0 0.2rem', fontWeight: 500, fontSize: '0.9rem', color: '#111827' }}>
                {c.commit.message.split('\n')[0]}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {c.commit.author.name}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                  {formatDate(c.commit.author.date)}
                </span>
                <code style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#374151', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                  {c.sha.slice(0, 7)}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
