import { useState, useEffect, useCallback } from 'react';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';
import axios from 'axios';
import { Archive, ArchiveRestore } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;

interface EventEntry {
  id: string;
  name: string;
  description: string;
  date: string;
  created_at: string;
  images: string[];
  archived_at?: string;
}

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Date (Newest)', 'Date (Oldest)'];

type Tab = 'active' | 'archived';

const filterByDate = (date: string, filter: string): boolean => {
  if (!filter || filter === 'All') return true;
  const fileDate = new Date(date);
  const now = new Date();
  if (filter === 'Today') return fileDate.toDateString() === now.toDateString();
  if (filter === 'This Week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return fileDate >= startOfWeek;
  }
  if (filter === 'This Month') {
    return fileDate.getMonth() === now.getMonth() && fileDate.getFullYear() === now.getFullYear();
  }
  return true;
};

const formatDate = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const groupByTerm = (items: EventEntry[]): Record<string, EventEntry[]> => {
  const groups: Record<string, EventEntry[]> = {};
  items.forEach(item => {
    const year = item.archived_at ? new Date(item.archived_at).getFullYear() : new Date().getFullYear();
    const term = `${year}-${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Events = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/events/archived`
        : `${API_URL}/events`;
      const { data: responseData } = await axios.get(endpoint, { withCredentials: true });
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  const handleActive = (entryId: string) =>
    setActive((prev) =>
      prev.includes(entryId) ? prev.filter((a) => a !== entryId) : [...prev, entryId],
    );

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handleArchive = async (entryId: string) => {
    await axios.post(`${API_URL}/events/archive`, { ids: [entryId] }, { withCredentials: true });
    fetchData();
  };

  const handleSoftDelete = async (id: string) => {
    if (!window.confirm('Move this item to the bin?')) return;
    try {
      await axios.post(`${API_URL}/events/archive`, { ids: [id] }, { withCredentials: true });
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: unknown) {
      setFetchError('Failed to move to bin: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (err instanceof Error ? err.message : 'Unknown')));
    }
  };

  const handleRestore = async (entryId: string) => {
    await axios.post(`${API_URL}/events/restore`, { ids: [entryId] }, { withCredentials: true });
    setData(prev => prev.filter(e => e.id !== entryId));
    fetchData();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/events/delete`, { data: { id }, withCredentials: true });
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      setFetchError('Delete failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (err instanceof Error ? err.message : 'Unknown')));
    }
  };

  const tabStyle = (t: Tab) => ({
    padding: '0.35rem 1rem',
    border: 'none',
    borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#3b82f6' : '#6b7280',
    fontSize: '0.9rem',
  });

  const toggleTerm = (term: string) =>
    setOpenTerms(prev => ({ ...prev, [term]: !prev[term] }));

  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isOpen = (term: string) =>
    openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  if (loading) {
    return (
      <div className='announce-container'>
        <div className='announce-header'><span>Events</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container'>
      <div className='announce-header'><span>Events</span></div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setTab('archived')}>Archived</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{data.length} Events</span>
        <div className='announce-toolbar-actions'>
          <FilterSelect options={filterOptions} value={filter} onChange={setFilter} label='Filter' />
          <FilterSelect options={sortOptions} value={sort} onChange={setSort} label='Sort' />
          <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
            <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
          </button>
          {tab === 'active' && (
            <button className='announce-add-btn' onClick={() => { setId(null); setEditTitle(''); setEditDescription(''); setEditDate(''); setOpen(true); }}>
              Add Event
            </button>
          )}
        </div>
      </div>

      {tab === 'active' && active.length >= 1 && (
        <Actionbar items={active.length} selectedIds={active} source='event' onSuccess={fetchData} />
      )}

      <div className='announce-file-table'>
        {tab === 'active' ? (
          <table>
            <colgroup>
              <col className='col-checkbox' />
              <col className='col-image' />
              <col className='col-filename' />
              <col className='col-description' />
              <col className='col-date' />
              <col className='col-actions' />
            </colgroup>
            <thead>
              <tr className='announce-table-header-light'>
                <th>
                  <input type='checkbox' title='Select All'
                    checked={data.length > 0 && active.length === data.length}
                    onChange={() => setActive(active.length === data.length ? [] : data.map((e) => e.id))}
                  />
                </th>
                <th>Photo</th>
                <th>Name</th>
                <th>Description</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((entry) => filterByDate(entry.date, filter))
                .sort((a, b) => {
                  if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
                  if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
                  if (sort === 'Date (Newest)') return new Date(b.date).getTime() - new Date(a.date).getTime();
                  if (sort === 'Date (Oldest)') return new Date(a.date).getTime() - new Date(b.date).getTime();
                  return 0;
                })
                .map((entry, idx) => (
                  <tr key={idx} className={`announce-table-row ${active.includes(entry.id) ? 'announce-active' : ''}`}
                    onMouseEnter={() => setHoveredRowId(entry.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>
                      <input className='checkbox' type='checkbox' title={`Select ${entry.name}`}
                        checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)}
                      />
                    </td>
                    <td>
                      {entry.images?.[0]
                        ? <img src={entry.images[0]} alt={entry.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        : '—'}
                    </td>
                    <td>{entry.name}</td>
                    <td>{entry.description}</td>
                    <td>{formatDate(entry.date)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === entry.id && (
                      <div className='announce-file-btn-inner'>
                        <button title='Archive' onClick={() => handleArchive(entry.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                          <Archive size={16} />
                        </button>
                        <img src='/bin.png' alt='Move to bin' title='Move to bin' onClick={() => handleSoftDelete(entry.id)} style={{ cursor: 'pointer' }} />
                        <img src='/edit.png' alt='Edit' onClick={() => {
                          setId(entry.id);
                          setEditTitle(entry.name);
                          setEditDescription(entry.description);
                          setEditDate(entry.date ?? '');
                          setEditImages(entry.images ?? []);
                          setOpen(true);
                        }} />
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <>
            {sortedTerms.length === 0 && (
              <p style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No archived events.</p>
            )}
            {sortedTerms.map(term => (
              <div key={term} style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleTerm(term)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9fafb', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}
                >
                  <span>Term {term}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {archivedGroups[term].length} item{archivedGroups[term].length !== 1 ? 's' : ''}&nbsp;{isOpen(term) ? '▲' : '▼'}
                  </span>
                </button>
                {isOpen(term) && (
                  <table style={{ width: '100%' }}>
                    <colgroup>
                      <col className='col-checkbox' />
                      <col className='col-image' />
                      <col className='col-filename' />
                      <col className='col-description' />
                      <col className='col-date' />
                      <col className='col-actions' />
                    </colgroup>
                    <thead>
                      <tr className='announce-table-header-light'>
                        <th></th>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedGroups[term].map((entry, idx) => (
                        <tr key={idx} className={`announce-table-row ${active.includes(entry.id) ? 'announce-active' : ''}`}>
                          <td>
                            <input className='checkbox' type='checkbox' title={`Select ${entry.name}`}
                              checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)}
                            />
                          </td>
                          <td>
                            {entry.images?.[0]
                              ? <img src={entry.images[0]} alt={entry.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                              : '—'}
                          </td>
                          <td>{entry.name}</td>
                          <td>{entry.description}</td>
                          <td>{formatDate(entry.date)}</td>
                          <td style={{ verticalAlign: 'middle', padding: '0.5rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleRestore(entry.id)}
                                style={{ color: '#16a34a', background: 'none', border: '1px solid #16a34a', borderRadius: '4px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(entry.id)}
                                style={{ color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: '4px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className='announce-modal-position'>
          <DeleteModal isOpen={isModalOpen} source='event' id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => { setActive((prev) => prev.filter((a) => a !== id)); fetchData(); }}
          />
        </div>
      )}

      {open && (
        <div className='announce-form-position'>
          <Form forType='event' id={id} initialTitle={editTitle} initialDescription={editDescription}
            initialDate={editDate} initialImages={editImages} setOpen={setOpen} onSuccess={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default Events;
