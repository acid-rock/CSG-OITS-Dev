/**
 * FeedbackPanel — /admin?panel=feedback
 *
 * Lists all site feedback submissions. Admins can:
 *   • Filter by status (new / read / resolved)
 *   • Click a row to expand the full message
 *   • Mark individual entries as read or resolved
 *   • Delete entries (single or bulk)
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../_shared/admin-list.css';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Toolbar } from '../_shared/chrome';
import { Tag } from '../_shared/atoms';
import { I } from '../_shared/icons';

const API = import.meta.env.VITE_API_URL as string;

/* ── Types ───────────────────────────────────────────────────── */
type FeedbackStatus = 'new' | 'read' | 'resolved';
type FeedbackType   = 'Bug Report' | 'Suggestion' | 'Other';

interface FeedbackEntry {
  id:         string;
  type:       FeedbackType;
  message:    string;
  name:       string | null;
  email:      string | null;
  status:     FeedbackStatus;
  created_at: string;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const STATUS_TONE: Record<FeedbackStatus, 'danger' | 'warning' | 'success'> = {
  new:      'danger',
  read:     'warning',
  resolved: 'success',
};

const TYPE_TONE: Record<FeedbackType, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  'Bug Report': 'danger',
  'Suggestion': 'primary',
  'Other':      'neutral',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Component ───────────────────────────────────────────────── */
export default function FeedbackPanel() {
  const [data,        setData]        = useState<FeedbackEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [statusTab,   setStatusTab]   = useState<'all' | FeedbackStatus>('all');
  const [search,      setSearch]      = useState('');
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [actionBusy,  setActionBusy]  = useState<string | null>(null); // id of entry being updated

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: rows } = await axios.get<FeedbackEntry[]>(
        `${API}/feedback`,
        { withCredentials: true },
      );
      setData(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived ────────────────────────────────────────────── */
  const counts = {
    all:      data.length,
    new:      data.filter(f => f.status === 'new').length,
    read:     data.filter(f => f.status === 'read').length,
    resolved: data.filter(f => f.status === 'resolved').length,
  };

  const filtered = data.filter(f => {
    const matchTab = statusTab === 'all' || f.status === statusTab;
    const q = search.toLowerCase();
    const matchSearch = !q
      || f.message.toLowerCase().includes(q)
      || f.type.toLowerCase().includes(q)
      || (f.name  ?? '').toLowerCase().includes(q)
      || (f.email ?? '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  /* ── Actions ────────────────────────────────────────────── */
  const handleStatus = async (id: string, status: FeedbackStatus) => {
    setActionBusy(id);
    try {
      const { data: updated } = await axios.patch<FeedbackEntry>(
        `${API}/feedback/status`,
        { id, status },
        { withCredentials: true },
      );
      setData(prev => prev.map(f => f.id === updated.id ? updated : f));
    } catch {
      // silent — table re-fetches on next refresh
    } finally {
      setActionBusy(null);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!ids.length) return;
    const label = ids.length === 1 ? 'this feedback entry' : `${ids.length} entries`;
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/feedback/delete`, {
        data: { ids },
        withCredentials: true,
      });
      setData(prev => prev.filter(f => !ids.includes(f.id)));
      setSelected(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
      if (expanded && ids.includes(expanded)) setExpanded(null);
    } catch {
      alert('Failed to delete. Please try again.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(f => f.id)));
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="ad-root">
      <div className="ad-shell">
        <Sidebar active="feedback" />

        <main className="ad-main">
          <PageHead
            title="Feedback"
            subtitle="Website feedback submitted by students and visitors."
          />

          {/* ── Status tab row ── */}
          <div className="ad-tabs" style={{ marginBottom: 0 }}>
            {(['all', 'new', 'read', 'resolved'] as const).map(tab => (
              <button
                key={tab}
                className={`ad-tab${statusTab === tab ? ' is-active' : ''}`}
                onClick={() => setStatusTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ad-tab-count">{counts[tab]}</span>
              </button>
            ))}
            <span className="ad-tab-spacer" />
            {counts.new > 0 && (
              <span className="ad-tab-hint">
                {counts.new} unread
              </span>
            )}
          </div>

          {/* ── Toolbar ── */}
          <Toolbar
            placeholder="Search by type, message, name or email…"
            search={search}
            onSearch={setSearch}
            showSort={false}
            onRefresh={fetchData}
          />

          {/* ── Bulk bar ── */}
          {selected.size > 0 && (
            <div className="ad-bulk-bar">
              <span className="ad-bulk-count">{selected.size} selected</span>
              <span className="ad-bulk-divider" />
              <button
                className="ad-bulk-btn ad-bulk-btn--danger"
                onClick={() => handleDelete([...selected])}
              >
                <I.trash width="12" height="12" /> Delete
              </button>
              <span className="ad-bulk-spacer" />
              <button
                className="ad-bulk-clear"
                onClick={() => setSelected(new Set())}
              >
                <I.x width="11" height="11" /> Clear
              </button>
            </div>
          )}

          {/* ── Table ── */}
          {loading && (
            <div className="ad-empty-state">
              <span className="ad-empty-icon"><I.refresh width="28" height="28" /></span>
              <p>Loading feedback…</p>
            </div>
          )}

          {!loading && error && (
            <div className="ad-empty-state">
              <p style={{ color: 'var(--color-danger-text)' }}>{error}</p>
              <button className="ad-btn ad-btn--secondary" onClick={fetchData}>Retry</button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="ad-empty-state">
              <span className="ad-empty-icon"><I.message width="28" height="28" /></span>
              <p>No feedback found.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th style={{ width: 100 }}>Type</th>
                    <th>Message</th>
                    <th style={{ width: 140 }}>From</th>
                    <th style={{ width: 90 }}>Status</th>
                    <th style={{ width: 140 }}>Submitted</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <>
                      <tr
                        key={f.id}
                        className={`ad-table-row${f.status === 'new' ? ' ad-table-row--highlight' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(prev => prev === f.id ? null : f.id)}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(f.id)}
                            onChange={() => toggleSelect(f.id)}
                          />
                        </td>
                        <td>
                          <Tag label={f.type} tone={TYPE_TONE[f.type]} />
                        </td>
                        <td>
                          <span className="ad-table-clamp">
                            {f.message.length > 90 ? f.message.slice(0, 90) + '…' : f.message}
                          </span>
                        </td>
                        <td>
                          <span className="ad-table-name">{f.name || '—'}</span>
                          {f.email && (
                            <span className="ad-table-sub">{f.email}</span>
                          )}
                        </td>
                        <td>
                          <Tag label={f.status} tone={STATUS_TONE[f.status]} />
                        </td>
                        <td>
                          <span className="ad-table-sub">{fmtDate(f.created_at)}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="ad-row-actions">
                            {f.status === 'new' && (
                              <button
                                className="ad-icon-btn"
                                title="Mark as read"
                                disabled={actionBusy === f.id}
                                onClick={() => handleStatus(f.id, 'read')}
                              >
                                <I.eye width="14" height="14" />
                              </button>
                            )}
                            {f.status !== 'resolved' && (
                              <button
                                className="ad-icon-btn"
                                title="Mark as resolved"
                                disabled={actionBusy === f.id}
                                onClick={() => handleStatus(f.id, 'resolved')}
                              >
                                <I.check width="14" height="14" />
                              </button>
                            )}
                            <button
                              className="ad-icon-btn ad-icon-btn--danger"
                              title="Delete"
                              onClick={() => handleDelete([f.id])}
                            >
                              <I.trash width="14" height="14" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded message row */}
                      {expanded === f.id && (
                        <tr key={`${f.id}-exp`} className="ad-table-row--expanded">
                          <td colSpan={7}>
                            <div className="ad-expanded-body">
                              <p className="ad-expanded-label">Full message</p>
                              <p className="ad-expanded-text">{f.message}</p>
                              {f.email && (
                                <a
                                  href={`mailto:${f.email}`}
                                  className="ad-expanded-reply"
                                >
                                  Reply to {f.email}
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>

              <footer className="ad-table-foot">
                <span className="ad-foot-count">
                  Showing <strong>{filtered.length}</strong> of{' '}
                  <strong>{data.length}</strong> entries
                </span>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
