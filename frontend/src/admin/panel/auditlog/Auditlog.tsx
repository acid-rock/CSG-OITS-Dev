import { useState, useEffect, useCallback } from 'react';
import '../_shared/admin-list.css';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Toolbar, TableFoot } from '../_shared/chrome';
import { Tag, MiniAvatar } from '../_shared/atoms';
import { I } from '../_shared/icons';
import { fmtDateTime, timeAgo, shortId, downloadCSV } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_by: string;
  admin_name: string;
  ip_address: string;
  created_at: string;
}

type Tone = 'primary'|'warning'|'danger'|'neutral'|'success';
const ACTION_TONE: Record<string, Tone> = { INSERT: 'success', UPDATE: 'primary', DELETE: 'danger' };

const PAGE_SIZE = 50;

const Audit = () => {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [sort, setSort] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const { data: r } = await axios.get<AuditEntry[]>(`${API_URL}/auditlog/`, { withCredentials: true });
      setData(r);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : 'Failed to load audit log.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Reset to page 1 whenever any filter/sort changes
  useEffect(() => { setPage(1); }, [selectedAction, dateFrom, dateTo, searchQuery, sort]);

  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setSelectedAction('All'); setPage(1); };

  const handleExportCSV = () => {
    downloadCSV(
      filtered.map(e => ({
        'Date & Time': fmtDateTime(e.created_at),
        Admin:         e.admin_name || e.created_by,
        Action:        e.action ?? '—',
        Table:         e.entity ?? '—',
        'Record ID':   e.entity_id ?? '—',
        'IP Address':  e.ip_address ?? '—',
      })),
      'audit-log'
    );
  };

  // Always show all CRUD action types — don't derive from data (data may only have some)
  const FIXED_ACTION_TYPES = ['All', 'INSERT', 'UPDATE', 'DELETE'];
  // Merge with any additional action types found in data
  const extraTypes = Array.from(new Set(data.map(e => e.action).filter(Boolean)))
    .filter(a => !FIXED_ACTION_TYPES.includes(a)).sort();
  const actionTypes = [...FIXED_ACTION_TYPES, ...extraTypes];

  const filtered = data
    .filter(e => selectedAction === 'All' || e.action === selectedAction)
    .filter(e => !dateFrom || new Date(e.created_at) >= new Date(dateFrom))
    .filter(e => !dateTo   || new Date(e.created_at) <= new Date(dateTo + 'T23:59:59'))
    .filter(e => !searchQuery || (e.admin_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || e.entity.toLowerCase().includes(searchQuery.toLowerCase()) || e.entity_id.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Date (Oldest)') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const pageStart    = (safePage - 1) * PAGE_SIZE;                // 0-indexed
  const pageEnd      = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageRows     = filtered.slice(pageStart, pageEnd);
  const shownLabel   = filtered.length === 0 ? '0' : `${pageStart + 1}–${pageEnd}`;

  /* Summary band stats */
  const now = new Date();
  const todayCount = data.filter(e => {
    const d = new Date(e.created_at);
    return d.getDate()===now.getDate() && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }).length;
  const adminCount = new Set(data.map(e => e.created_by)).size;
  const deletions7d = data.filter(e => {
    const d = new Date(e.created_at);
    return e.action === 'DELETE' && (Date.now() - d.getTime()) < 7 * 86400000;
  }).length;

  return (
    <div className="ad-shell">
      <Sidebar active="auditlog" />
      <main className="ad-main">
        <PageHead
          title="Audit Log"
          subtitle="Every change made through the CMS — who, what, where, and when. Read-only."
          actions={<>
            <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
            <button className="ad-btn-ghost" onClick={handleExportCSV}><I.download width="14" height="14" />Export CSV</button>
          </>}
        />

        {/* Summary band */}
        <div className="ad-audit-summary">
          <div className="ad-audit-stat">
            <span className="ad-audit-stat-num">{data.length}</span>
            <span className="ad-audit-stat-lbl">Total entries</span>
          </div>
          <div className="ad-audit-stat">
            <span className="ad-audit-stat-num">{todayCount}</span>
            <span className="ad-audit-stat-lbl">Today</span>
          </div>
          <div className="ad-audit-stat">
            <span className="ad-audit-stat-num">{adminCount}</span>
            <span className="ad-audit-stat-lbl">Active admins</span>
          </div>
          <div className="ad-audit-stat">
            <span className={`ad-audit-stat-num${deletions7d > 0 ? ' is-danger' : ''}`}>{deletions7d}</span>
            <span className="ad-audit-stat-lbl">Deletions (7d)</span>
          </div>
        </div>

        <Toolbar
          placeholder="Search by admin, table, or record ID…"
          search={searchQuery} onSearch={setSearchQuery}
          onRefresh={handleRefresh}
          showSort={false}
        >
          <span className="ad-filter-label">Action</span>
          <select
            className="ad-filter-select"
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
          >
            {actionTypes.map(a => (
              <option key={a} value={a}>
                {a === 'All' ? 'Action: All' : a}
              </option>
            ))}
          </select>
          {/* Date range — inline beside other filters */}
          <span className="ad-filter-label">From</span>
          <input
            type="date"
            className="ad-filter-select"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={e => setDateFrom(e.target.value)}
            style={{ width: 150 }}
          />
          <span className="ad-filter-label" style={{ padding: '0 2px' }}>→</span>
          <input
            type="date"
            className="ad-filter-select"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={e => setDateTo(e.target.value)}
            style={{ width: 150 }}
          />
          {(dateFrom || dateTo) && (
            <button className="ad-icon-btn" title="Clear dates" onClick={clearFilters} style={{ flexShrink: 0 }}>
              <I.x width="11" height="11" />
            </button>
          )}
          <span className="ad-filter-label">Sort</span>
          <select
            className="ad-filter-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="">Newest first</option>
            <option value="Date (Oldest)">Oldest first</option>
          </select>
        </Toolbar>
        <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>
          Showing <strong>{filtered.length}</strong> of <strong>{data.length}</strong> entries
        </span>

        {fetchError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{fetchError}</p>}

        {loading ? (
          <section className="ad-card"><div className="ad-empty"><p>Loading audit log… this may take a moment for large datasets.</p></div></section>
        ) : (
          <section className="ad-card">
            <table className="ad-table">
              <colgroup><col style={{minWidth:260}}/><col style={{width:130}}/><col style={{width:160}}/><col style={{width:160}}/><col style={{width:200}}/></colgroup>
              <thead><tr>
                <th>Admin</th><th>Action</th><th>Table</th><th>Record ID</th><th>Date &amp; time</th>
              </tr></thead>
              <tbody>
                {pageRows.length === 0 && <tr><td colSpan={5}><div className="ad-empty"><p>No entries match your filters.</p></div></td></tr>}
                {pageRows.map((entry, i) => (
                  <tr key={entry.id ?? i}>
                    <td>
                      <div className="ad-author">
                        <MiniAvatar name={entry.admin_name || entry.created_by} />
                        <span className="ad-mono">{entry.admin_name || shortId(entry.created_by)}</span>
                      </div>
                    </td>
                    <td><Tag label={entry.action ?? '—'} tone={ACTION_TONE[entry.action] ?? 'neutral'} /></td>
                    <td><span className="ad-mono ad-cell-text">{entry.entity ?? '—'}</span></td>
                    <td>
                      <span className="ad-mono ad-cell-muted" title={entry.entity_id}>
                        {shortId(entry.entity_id)}
                      </span>
                    </td>
                    <td>
                      <div className="ad-date">
                        <span className="ad-date-abs">{fmtDateTime(entry.created_at)}</span>
                        <span className="ad-date-rel">{entry.created_at ? timeAgo(entry.created_at) : '—'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ad-table-foot">
              <span className="ad-foot-count">
                Showing <strong>{shownLabel}</strong> of <strong>{filtered.length}</strong> entries
                {filtered.length < data.length && <> (filtered from <strong>{data.length}</strong> total)</>}
              </span>
              {totalPages > 1 && (
                <div className="ad-foot-pager">
                  <button
                    className="ad-icon-btn"
                    disabled={safePage === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    title="Previous page"
                  >‹</button>
                  {/* Show up to 7 page buttons with ellipsis */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
                    .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, idx) =>
                      n === '…'
                        ? <span key={`ell-${idx}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)', fontSize: 13 }}>…</span>
                        : <button
                            key={n}
                            className={`ad-icon-btn${n === safePage ? ' is-on' : ''}`}
                            onClick={() => setPage(n as number)}
                            style={{ minWidth: 32, fontWeight: n === safePage ? 700 : 400 }}
                          >{n}</button>
                    )
                  }
                  <button
                    className="ad-icon-btn"
                    disabled={safePage === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    title="Next page"
                  >›</button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Audit;
