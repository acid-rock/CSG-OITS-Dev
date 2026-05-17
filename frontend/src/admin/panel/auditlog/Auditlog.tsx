import { useState, useEffect, useCallback } from 'react';
import './auditlog.css';
import FilterSelect from '../../components/filter/Filter';
import axios from 'axios';

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

const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Date (Newest)', 'Date (Oldest)'];

function formatAction(action: string): string {
  if (!action) return '—';
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const shortId = (uuid: string | null): string =>
  uuid ? uuid.substring(0, 8) + '…' : '—';

const Audit = () => {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: responseData } = await axios.get<AuditEntry[]>(
        `${API_URL}/auditlog/`, { withCredentials: true },
      );
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActive = (entryId: string) => {
    setActive(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId],
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const clearDateFilter = () => { setDateFrom(''); setDateTo(''); };

  const actionTypes = [
    'All',
    ...Array.from(new Set(data.map(e => e.action).filter(Boolean))).sort(),
  ];

  const hasFilter = !!(dateFrom || dateTo || (selectedAction && selectedAction !== 'All'));

  const filtered = data
    .filter(entry => {
      const entryDate = new Date(entry.created_at);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      if (from && entryDate < from) return false;
      if (to && entryDate > to) return false;
      if (selectedAction !== 'All' && entry.action !== selectedAction) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.entity.localeCompare(b.entity);
      if (sort === 'Name (Z-A)') return b.entity.localeCompare(a.entity);
      if (sort === 'Date (Newest)')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'Date (Oldest)')
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  if (loading) {
    return (
      <div className='audit-container'>
        <div className='audit-header'><span>Audit Log</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='audit-container'>
      <div className='audit-header'><span>Audit Log</span></div>

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'var(--color-danger)' }}>{fetchError}</p>
      )}

      <div className='audit-toolbar'>
        <span className='audit-file-count'>{data.length} Entries</span>
        <div className='audit-toolbar-actions'>

          {/* Action type filter */}
          <select
            className='audit-action-select'
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            aria-label='Filter by action type'
          >
            {actionTypes.map(type => (
              <option key={type} value={type}>{formatAction(type)}</option>
            ))}
          </select>

          {/* Date range */}
          <div className='audit-date-range'>
            <div className='audit-date-field'>
              <label className='audit-date-label'>From</label>
              <input
                type='date'
                className='audit-date-input'
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </div>
            <div className='audit-date-field'>
              <label className='audit-date-label'>To</label>
              <input
                type='date'
                className='audit-date-input'
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type='button'
                className='audit-date-clear'
                onClick={clearDateFilter}
                title='Clear date filter'
              >
                ×
              </button>
            )}
          </div>

          <FilterSelect options={sortOptions} value={sort} onChange={setSort} label='Sort' />

          <button
            type='button'
            className='audit-action-btn'
            title='Refresh'
            onClick={handleRefresh}
          >
            <img
              src='/refresh.png'
              alt='refresh'
              className={`refresh-img${spinning ? ' audit-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {hasFilter && (
        <p className='audit-filter-count'>
          Showing {filtered.length} of {data.length} entries
        </p>
      )}

      <div className='audit-file-table'>
        <table>
          <colgroup>
            <col className='audit-col-user' />
            <col className='audit-col-image' />
            <col className='audit-col-filename' />
            <col className='audit-col-description' />
            <col className='audit-col-date' />
          </colgroup>
          <thead>
            <tr className='audit-table-header-light'>
              <th>Admin</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => (
              <tr
                key={idx}
                className={`audit-table-row ${active.includes(entry.id) ? 'audit-active' : ''}`}
                onClick={() => handleActive(entry.id)}
              >
                <td>
                  <div className='audit-user-cell'>
                    <span className='audit-user-name' title={entry.created_by}>
                      {entry.admin_name ?? shortId(entry.created_by)}
                    </span>
                    <span className='audit-role-badge audit-role-admin'>Admin</span>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        entry.action === 'DELETE' ? 'var(--color-danger)'
                        : entry.action === 'INSERT' ? 'var(--color-success)'
                        : 'var(--color-primary)',
                    }}
                  >
                    {formatAction(entry.action)}
                  </span>
                </td>
                <td>{entry.entity ?? '—'}</td>
                <td title={entry.entity_id}>{shortId(entry.entity_id)}</td>
                <td className='audit-datetime'>
                  {entry.created_at ? formatDateTime(entry.created_at) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
                >
                  No entries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
