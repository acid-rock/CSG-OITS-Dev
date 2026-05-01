import { useState, useEffect, useCallback } from 'react';
import FilterSelect from '../../components/filter/Filter';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import Actionbar from '../../components/action-bar/Actionbar';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string;

interface EventEntry {
  id: string;
  name: string;
  description: string;
  date: string;
  created_at: string;
  images: string[];
}

const filterOptions = ['All', 'Today', 'This Week', 'This Month'];
const sortOptions = [
  'Name (A-Z)',
  'Name (Z-A)',
  'Date (Newest)',
  'Date (Oldest)',
];

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
    return (
      fileDate.getMonth() === now.getMonth() &&
      fileDate.getFullYear() === now.getFullYear()
    );
  }
  return true;
};

const formatDate = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Events = () => {
  const [data, setData] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: responseData } = await axios.get(`${API_URL}/events`, {
        withCredentials: true,
      });
      setData(responseData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load events.';
      setFetchError(message);
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
        ? prev.filter((a) => a !== entryId)
        : [...prev, entryId],
    );
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  if (loading) {
    return (
      <div className='announce-container'>
        <div className='announce-header'>
          <span>Events</span>
        </div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container'>
      <div className='announce-header'>
        <span>Events</span>
      </div>

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{data.length} Events</span>
        <div className='announce-toolbar-actions'>
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
            className='announce-action-btn announce-refresh-btn'
            title='Refresh'
            onClick={handleRefresh}
          >
            <img
              src='/refresh.png'
              alt='refresh'
              className={spinning ? 'announce-spin refresh-img' : 'refresh-img'}
            />
          </button>
          <button
            className='announce-add-btn'
            onClick={() => {
              setId(null);
              setEditTitle('');
              setEditDescription('');
              setEditDate('');
              setOpen(true);
            }}
          >
            Add Event
          </button>
        </div>
      </div>

      {active.length >= 3 && (
        <Actionbar
          items={active.length}
          selectedIds={active}
          source='event'
          onSuccess={fetchData}
        />
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
                <input
                  type='checkbox'
                  title='Select All'
                  checked={data.length > 0 && active.length === data.length}
                  onChange={() => {
                    if (active.length === data.length) {
                      setActive([]);
                    } else {
                      setActive(data.map((entry) => entry.id));
                    }
                  }}
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
                if (sort === 'Name (A-Z)')
                  return a.name.localeCompare(b.name);
                if (sort === 'Name (Z-A)')
                  return b.name.localeCompare(a.name);
                if (sort === 'Date (Newest)')
                  return (
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                if (sort === 'Date (Oldest)')
                  return (
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                return 0;
              })
              .map((entry, idx) => (
                <tr
                  key={idx}
                  className={`announce-table-row ${active.includes(entry.id) ? 'announce-active' : ''}`}
                >
                  <td>
                    <input
                      className='checkbox'
                      type='checkbox'
                      title={`Select ${entry.name}`}
                      checked={active.includes(entry.id)}
                      onChange={() => handleActive(entry.id)}
                    />
                  </td>
                  <td>
                    {entry.images?.[0] ? (
                      <img
                        src={entry.images[0]}
                        alt={entry.name}
                        style={{ width: 40, height: 40, objectFit: 'cover' }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{entry.name}</td>
                  <td>{entry.description}</td>
                  <td>{formatDate(entry.date)}</td>
                  <td className='announce-file-btn'>
                    <div className='announce-file-btn-inner'>
                      <img
                        src='/bin.png'
                        alt='Delete'
                        onClick={() => {
                          setId(entry.id);
                          setIsModalOpen(true);
                        }}
                      />
                      <img
                        src='/edit.png'
                        alt='Edit'
                        onClick={() => {
                          setId(entry.id);
                          setEditTitle(entry.name);
                          setEditDescription(entry.description);
                          setEditDate(entry.date ?? '');
                          setOpen(true);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className='announce-modal-position'>
          <DeleteModal
            isOpen={isModalOpen}
            source='event'
            id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setActive((prev) => prev.filter((a) => a !== id));
              fetchData();
            }}
          />
        </div>
      )}

      {open && (
        <div className='announce-form-position'>
          <Form
            forType='event'
            id={id}
            initialTitle={editTitle}
            initialDescription={editDescription}
            initialDate={editDate}
            setOpen={setOpen}
            onSuccess={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default Events;
