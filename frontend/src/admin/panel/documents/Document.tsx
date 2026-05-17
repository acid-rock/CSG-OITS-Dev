import { useState, useEffect, useCallback } from 'react';
import './document.css';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';
import axios from 'axios';
import { Archive, ArchiveRestore, Eye } from 'lucide-react';
import PublicPreviewModal from '../../components/modals/PublicPreviewModal/PublicPreviewModal';

const API_URL = import.meta.env.VITE_API_URL as string;

interface DocumentEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  url: string;
  thumbnail: string;
  term?: string;
  deleted_at?: string;
}

// filterOptions is now computed dynamically inside the component from data
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Date (Newest)', 'Date (Oldest)'];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

type Tab = 'active' | 'archived' | 'bin';

const groupByTerm = (items: DocumentEntry[]): Record<string, DocumentEntry[]> => {
  const groups: Record<string, DocumentEntry[]> = {};
  items.forEach(item => {
    const year = item.deleted_at ? new Date(item.deleted_at).getFullYear() : new Date().getFullYear();
    const term = `${year}-${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Documents = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<DocumentEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/documents/archived?t=${Date.now()}`
        : tab === 'bin'
        ? `${API_URL}/documents/bin?t=${Date.now()}`
        : `${API_URL}/documents`;
      const { data: responseData } = await axios.get<DocumentEntry[]>(endpoint, { withCredentials: true });
      setData(Array.isArray(responseData) ? responseData : (responseData as any).data ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  const handleActive = (entryId: string) =>
    setActive((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId],
    );

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handleArchive = async (entryId: string) => {
    await axios.post(`${API_URL}/documents/archive`, { ids: [entryId] }, { withCredentials: true });
    fetchData();
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await axios.post(`${API_URL}/documents/bin`, { ids: [id] }, { withCredentials: true });
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: unknown) {
      setFetchError('Failed to move to bin: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (err instanceof Error ? err.message : 'Unknown')));
    }
  };

  const handleRestore = async (entryId: string) => {
    await axios.post(`${API_URL}/documents/restore`, { ids: [entryId] }, { withCredentials: true });
    setData((prev) => prev.filter((d) => d.id !== entryId));
    fetchData();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/documents/delete`, { data: [{ id }], withCredentials: true });
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

  // Dynamic filter options derived from fetched document categories
  const formatTypeLabel = (raw: string) =>
    raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const docTypes = [...new Set(data.map((d) => d.category).filter(Boolean))].sort();
  const filterOptions = ['All', ...docTypes.map(formatTypeLabel)];

  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isOpen = (term: string) =>
    openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  if (loading) {
    return (
      <div className='docs-container'>
        <div className='docs-header'><span>Documents</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='docs-container'>
      <div className='docs-header'><span>Documents</span></div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setTab('archived')}>Archived</button>
        <button style={tabStyle('bin')} onClick={() => setTab('bin')}>Bin</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='docs-toolbar'>
        <span className='docs-file-count'>{data.length} Files</span>
        <input
          type='text'
          placeholder='Search...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', minWidth: 0 }}
        />
        <div className='docs-toolbar-actions'>
          <FilterSelect options={filterOptions} value={filter} onChange={setFilter} label='Filter' />
          <FilterSelect options={sortOptions} value={sort} onChange={setSort} label='Sort' />
          <button className='docs-action-btn docs-refresh-btn' title='Refresh' onClick={handleRefresh}>
            <img src='/refresh.png' alt='refresh' className={spinning ? 'docs-spin refresh-img' : 'refresh-img'} />
          </button>
          {tab === 'active' && (
            <button className='docs-add-btn' onClick={() => { setId(null); setSelectedName(null); setEditTitle(''); setEditDescription(''); setEditType(''); setOpen(true); }}>
              Add Document
            </button>
          )}
        </div>
      </div>

      {tab === 'active' && active.length >= 1 && (
        <Actionbar items={active.length} selectedIds={active} source='document' onSuccess={fetchData} />
      )}

      <div className='docs-file-table'>
        {tab === 'active' ? (
          <table>
            <colgroup>
              <col className='col-checkbox' />
              <col className='col-image' />
              <col className='col-filename' />
              <col className='col-description' />
              <col style={{ width: '90px' }} />
              <col className='col-date' />
              <col className='col-actions' />
            </colgroup>
            <thead>
              <tr className='docs-table-header-light'>
                <th>
                  <input type='checkbox' title='Select All'
                    checked={data.length > 0 && active.length === data.length}
                    onChange={() => setActive(active.length === data.length ? [] : data.map((e) => e.id))}
                  />
                </th>
                <th>Thumbnail</th>
                <th>File Name</th>
                <th>Description</th>
                <th>Term</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter((entry) => filter === 'All' || !filter || formatTypeLabel(entry.category ?? '') === filter)
                .filter((entry) => !searchQuery || entry.name.toLowerCase().includes(searchQuery.toLowerCase()) || (entry.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => {
                  if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
                  if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
                  if (sort === 'Date (Newest)') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  if (sort === 'Date (Oldest)') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  return 0;
                })
                .map((entry, idx) => (
                  <tr key={idx} className={`docs-table-row ${active.includes(entry.id) ? 'docs-active' : ''}`}
                    onMouseEnter={() => setHoveredRowId(entry.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>
                      <input className='checkbox' type='checkbox' title={`Select ${entry.name}`}
                        checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)}
                      />
                    </td>
                    <td>
                      {entry.thumbnail
                        ? <img src={entry.thumbnail} alt={entry.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        : '—'}
                    </td>
                    <td>{entry.name}</td>
                    <td>{entry.description}</td>
                    <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{entry.term ?? '—'}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td className='docs-file-btn'>
                      {hoveredRowId === entry.id && (
                      <div className='docs-file-btn-inner'>
                        <button title='Preview public view' onClick={() => setPreviewItem(entry)}
                          className='action-btn action-btn--preview'>
                          <Eye size={16} />
                        </button>
                        <button title='Archive' onClick={() => handleArchive(entry.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                          <Archive size={16} />
                        </button>
                        <img src='/bin.png' alt='Move to bin' title='Move to bin' onClick={() => handleSoftDelete(entry.id)} style={{ cursor: 'pointer' }} />
                        <img src='/edit.png' alt='Edit' onClick={() => {
                          setId(entry.id);
                          setSelectedName(entry.name);
                          setEditTitle(entry.name);
                          setEditDescription(entry.description);
                          setEditType(entry.category);
                          setOpen(true);
                        }} />
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : tab === 'archived' ? (
          <>
            {sortedTerms.length === 0 && (
              <p style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No archived documents.</p>
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
                      <col style={{ width: '90px' }} />
                      <col className='col-date' />
                      <col className='col-actions' />
                    </colgroup>
                    <thead>
                      <tr className='docs-table-header-light'>
                        <th></th>
                        <th>Thumbnail</th>
                        <th>File Name</th>
                        <th>Description</th>
                        <th>Term</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedGroups[term].map((entry, idx) => (
                        <tr key={idx} className={`docs-table-row ${active.includes(entry.id) ? 'docs-active' : ''}`}>
                          <td>
                            <input className='checkbox' type='checkbox' title={`Select ${entry.name}`}
                              checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)}
                            />
                          </td>
                          <td>
                            {entry.thumbnail
                              ? <img src={entry.thumbnail} alt={entry.name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                              : '—'}
                          </td>
                          <td>{entry.name}</td>
                          <td>{entry.description}</td>
                          <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{entry.term ?? '—'}</td>
                          <td>{formatDate(entry.createdAt)}</td>
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
        ) : tab === 'bin' ? (
          <>
            {data.length === 0 && <p style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No items in bin.</p>}
            {data.length > 0 && (
              <table>
                <thead>
                  <tr className='docs-table-header-light'>
                    <th>Name</th><th>Description</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry) => (
                    <tr key={entry.id} className='announce-table-row'>
                      <td>{entry.name}</td>
                      <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleRestore(entry.id)} style={{ color: '#16a34a', background: 'none', border: '1px solid #16a34a', borderRadius: '4px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', cursor: 'pointer' }}>Restore</button>
                          <button onClick={() => handlePermanentDelete(entry.id)} style={{ color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: '4px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}
      </div>

      {open && (
        <div className='docs-form-position'>
          <Form forType='document' id={id} initialTitle={editTitle} initialDescription={editDescription}
            initialType={editType} setOpen={setOpen} onSuccess={fetchData}
          />
        </div>
      )}

      {isModalOpen && (
        <div className='docs-modal-position'>
          <DeleteModal isOpen={isModalOpen} source='document' id={id} name={selectedName}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => { setActive((prev) => prev.filter((a) => a !== id)); fetchData(); }}
          />
        </div>
      )}

      {previewItem && (
        <PublicPreviewModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          type='document'
          item={previewItem as unknown as Record<string, unknown>}
        />
      )}
    </div>
  );
};

export default Documents;
