import { useState, useEffect, useCallback } from 'react';
import './announcement.css';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';
import axios from 'axios';
import { filterByDate } from '../../utils/filterByDate';
import { Pin, PinOff, Archive, ArchiveRestore } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;

interface BulletinEntry {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  archived_at?: string;
}

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = ['Name (A-Z)', 'Name (Z-A)', 'Date (Newest)', 'Date (Oldest)'];

type Tab = 'active' | 'archived';

const Announcement = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<BulletinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/announcements/archived`
        : `${API_URL}/announcements/`;
      const { data: responseData } = await axios.get(endpoint, { withCredentials: true });
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load announcements.');
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

  const handleTogglePin = async (entry: BulletinEntry) => {
    try {
      await axios.post(`${API_URL}/announcements/pin`, { id: entry.id, is_pinned: !entry.is_pinned }, { withCredentials: true });
    } finally {
      fetchData();
    }
  };

  const handleArchive = async (entryId: string) => {
    await axios.post(`${API_URL}/announcements/archive`, { ids: [entryId] }, { withCredentials: true });
    fetchData();
  };

  const handleRestore = async (entryId: string) => {
    await axios.post(`${API_URL}/announcements/restore`, { ids: [entryId] }, { withCredentials: true });
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
      <div className='announce-container'>
        <div className='announce-header'><span>Announcement</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container'>
      <div className='announce-header'><span>Announcement</span></div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setTab('archived')}>Archived</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{data.length} Files</span>
        <div className='announce-toolbar-actions'>
          <FilterSelect options={filterOptions} value={filter} onChange={setFilter} label='Filter' />
          <FilterSelect options={sortOptions} value={sort} onChange={setSort} label='Sort' />
          <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
            <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
          </button>
          {tab === 'active' && (
            <button className='announce-add-btn' onClick={() => { setId(null); setEditTitle(''); setEditDescription(''); setOpen(true); }}>
              Add Announcement
            </button>
          )}
        </div>
      </div>

      {tab === 'active' && active.length >= 3 && (
        <Actionbar items={active.length} selectedIds={active} source='announcement' />
      )}

      <div className='announce-file-table'>
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
              <th>Image</th>
              <th>File Name</th>
              <th>Description</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter((entry) => filterByDate(entry.date, filter))
              .sort((a, b) => {
                if (sort === 'Name (A-Z)') return a.title.localeCompare(b.title);
                if (sort === 'Name (Z-A)') return b.title.localeCompare(a.title);
                if (sort === 'Date (Newest)') return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (sort === 'Date (Oldest)') return new Date(a.date).getTime() - new Date(b.date).getTime();
                return 0;
              })
              .map((entry, idx) => (
                <tr
                  key={idx}
                  className={`announce-table-row ${active.includes(entry.id) ? 'announce-active' : ''}`}
                  style={entry.is_pinned ? { background: '#fef9c3' } : undefined}
                >
                  <td>
                    <input className='checkbox' type='checkbox' title={`Select ${entry.title}`}
                      checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)}
                    />
                  </td>
                  <td>
                    {entry.imgUrl
                      ? <img src={entry.imgUrl} alt={entry.title} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                      : '—'}
                  </td>
                  <td>
                    {entry.title}
                    {entry.is_pinned && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#f59e0b', color: '#fff', borderRadius: '4px', padding: '0.1rem 0.4rem', verticalAlign: 'middle' }}>
                        Pinned
                      </span>
                    )}
                  </td>
                  <td>{entry.content}</td>
                  <td>{entry.date}</td>
                  <td className='announce-file-btn'>
                    <div className='announce-file-btn-inner'>
                      {tab === 'active' ? (
                        <>
                          <button title={entry.is_pinned ? 'Unpin' : 'Pin to top'} onClick={() => handleTogglePin(entry)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: entry.is_pinned ? '#f59e0b' : '#9ca3af', display: 'flex', alignItems: 'center' }}>
                            {entry.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                          </button>
                          <button title='Archive' onClick={() => handleArchive(entry.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                            <Archive size={16} />
                          </button>
                          <img src='/bin.png' alt='Delete' onClick={() => { setId(entry.id); setIsModalOpen(true); }} />
                          <img src='/edit.png' alt='Edit' onClick={() => { setId(entry.id); setEditTitle(entry.title); setEditDescription(entry.content); setOpen(true); }} />
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

      {isModalOpen && (
        <div className='announce-modal-position'>
          <DeleteModal isOpen={isModalOpen} source='announcement' id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => { setActive((prev) => prev.filter((a) => a !== id)); fetchData(); }}
          />
        </div>
      )}

      {open && (
        <div className='announce-form-position'>
          <Form forType='announcement' id={id} initialTitle={editTitle} initialDescription={editDescription}
            setOpen={setOpen} onSuccess={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default Announcement;
