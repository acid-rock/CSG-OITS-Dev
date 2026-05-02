import { useState, useEffect, useCallback } from 'react';
import './document.css';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';
import axios from 'axios';
import { filterByDate } from '../../utils/filterByDate';
import { Archive, ArchiveRestore } from 'lucide-react';

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
  is_archived?: boolean;
  archived_at?: string;
}

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Date (Newest)', 'Date (Oldest)'];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

type Tab = 'active' | 'archived';

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/documents/archived`
        : `${API_URL}/documents`;
      const { data: responseData } = await axios.get<DocumentEntry[]>(endpoint, { withCredentials: true });
      setData(Array.isArray(responseData) ? responseData : (responseData as any).data ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleRestore = async (entryId: string) => {
    await axios.post(`${API_URL}/documents/restore`, { ids: [entryId] }, { withCredentials: true });
    fetchData();
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

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setTab('archived')}>Archived</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='docs-toolbar'>
        <span className='docs-file-count'>{data.length} Files</span>
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

      {tab === 'active' && active.length >= 3 && (
        <Actionbar items={active.length} selectedIds={active} source='document' />
      )}

      <div className='docs-file-table'>
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
              .filter((entry) => filterByDate(entry.createdAt, filter))
              .sort((a, b) => {
                if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
                if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
                if (sort === 'Date (Newest)') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sort === 'Date (Oldest)') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                return 0;
              })
              .map((entry, idx) => (
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
                  <td className='docs-file-btn'>
                    <div className='docs-file-btn-inner'>
                      {tab === 'active' ? (
                        <>
                          <button title='Archive' onClick={() => handleArchive(entry.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                            <Archive size={16} />
                          </button>
                          <img src='/bin.png' alt='Delete' onClick={() => { setId(entry.id); setSelectedName(entry.name); setIsModalOpen(true); }} />
                          <img src='/edit.png' alt='Edit' onClick={() => {
                            setId(entry.id);
                            setSelectedName(entry.name);
                            setEditTitle(entry.name);
                            setEditDescription(entry.description);
                            setEditType(entry.category);
                            setOpen(true);
                          }} />
                        </>
                      ) : (
                        <button title='Restore' onClick={() => handleRestore(entry.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                          <ArchiveRestore size={16} /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
    </div>
  );
};

export default Documents;
