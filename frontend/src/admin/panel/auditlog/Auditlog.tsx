import { useState, useEffect, useCallback } from 'react';
import './auditlog.css';
import FilterSelect from '../../components/filter/Filter';
import { filterByDate } from '../../utils/filterByDate';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AuditEntry {
  id: string;
  action: string;       // 'INSERT' | 'UPDATE' | 'DELETE'
  entity: string;       // table name (bulletin, documents, events…)
  entity_id: string;    // uuid of the affected row
  created_by: string;   // admin user uuid
  ip_address: string;
  created_at: string;
}

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = [
  'Name (A-Z)',
  'Name (Z-A)',
  'Date (Newest)',
  'Date (Oldest)',
];

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: responseData } = await axios.get<AuditEntry[]>(
        `${API_URL}/auditlog/`,
        { withCredentials: true },
      );
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : 'Failed to load audit log.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActive = (entryId: string) => {
    setActive((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const filtered = data
    .filter((entry) => filterByDate(entry.created_at, filter))
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
      <div className='audit-header'>
        <span>Audit Log</span>
      </div>

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      <div className='audit-toolbar'>
        <span className='audit-file-count'>{data.length} Entries</span>
        <div className='audit-toolbar-actions'>
          <FilterSelect
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            label='Filter'
          />
          <FilterSelect
            options={sortOptions}
            value={sort}
            onChange={setSort}
            label='Sort'
          />
          <button
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
              <th>Admin ID</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th>Date & Time</th>
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
                      {shortId(entry.created_by)}
                    </span>
                    <span className='audit-role-badge audit-role-admin'>
                      Admin
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        entry.action === 'DELETE'
                          ? '#dc2626'
                          : entry.action === 'INSERT'
                            ? '#16a34a'
                            : '#2563eb',
                    }}
                  >
                    {entry.action ?? '—'}
                  </span>
                </td>
                <td>{entry.entity ?? '—'}</td>
                <td title={entry.entity_id}>{shortId(entry.entity_id)}</td>
                <td className='audit-datetime'>
                  {entry.created_at ? formatDateTime(entry.created_at) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
