import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConfimationModal from '../../admin/components/modals/confirmationModal/ConfimationModal';

const API_URL = import.meta.env.VITE_API_URL as string;

interface BinDocument {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  url: string;
  thumbnail: string;
  deleted_at: string;
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Bin = () => {
  const [data, setData] = useState<BinDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [active, setActive] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: res } = await axios.get<BinDocument[]>(
        `${API_URL}/documents/bin`,
        { withCredentials: true },
      );
      setData(res);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load bin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActive = (id: string) =>
    setActive((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const restoreSelected = async () => {
    if (!active.length) return;
    await axios.post(`${API_URL}/documents/restore`, active, {
      withCredentials: true,
    });
    setActive([]);
    await fetchData();
  };

  const confirmThenRun = (action: () => Promise<void>) => {
    setPendingAction(() => action);
    setConfirmOpen(true);
  };

  const purgeSelected = () =>
    confirmThenRun(async () => {
      await axios.delete(`${API_URL}/documents/bin/purge`, {
        data: active,
        withCredentials: true,
      });
      setActive([]);
      await fetchData();
    });

  const purgeAll = () =>
    confirmThenRun(async () => {
      await axios.delete(`${API_URL}/documents/bin/purge`, {
        data: [],
        withCredentials: true,
      });
      await fetchData();
    });

  if (loading) {
    return (
      <div className='announce-container'>
        <div className='announce-header'><span>Bin</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container'>
      <div className='announce-header'><span>Bin</span></div>

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{data.length} items in bin</span>
        <div className='announce-toolbar-actions'>
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

          {active.length > 0 && (
            <>
              <button className='announce-add-btn' onClick={restoreSelected}>
                Restore ({active.length})
              </button>
              <button
                className='announce-add-btn'
                style={{ background: '#c0392b' }}
                onClick={purgeSelected}
              >
                Delete Permanently ({active.length})
              </button>
            </>
          )}

          <button
            className='announce-add-btn'
            style={{ background: '#7f8c8d' }}
            onClick={purgeAll}
          >
            Purge &gt;30 days
          </button>
        </div>
      </div>

      <p style={{ padding: '0.25rem 1rem', fontSize: '0.8rem', color: '#888' }}>
        Items in the bin can be restored. Items older than 30 days are eligible for permanent purge.
      </p>

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
                  onChange={() =>
                    setActive(active.length === data.length ? [] : data.map((d) => d.id))
                  }
                />
              </th>
              <th>Thumbnail</th>
              <th>File Name</th>
              <th>Description</th>
              <th>Deleted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((doc, idx) => (
              <tr
                key={idx}
                className={`announce-table-row ${active.includes(doc.id) ? 'announce-active' : ''}`}
              >
                <td>
                  <input
                    className='checkbox'
                    type='checkbox'
                    checked={active.includes(doc.id)}
                    onChange={() => handleActive(doc.id)}
                    title={`Select ${doc.name}`}
                  />
                </td>
                <td>
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.name}
                      style={{ width: 40, height: 40, objectFit: 'cover' }}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{doc.name}</td>
                <td>{doc.description}</td>
                <td>{formatDate(doc.deleted_at)}</td>
                <td className='announce-file-btn'>
                  <div className='announce-file-btn-inner'>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#27ae60',
                        padding: '0.2rem 0.5rem',
                      }}
                      onClick={async () => {
                        await axios.post(
                          `${API_URL}/documents/restore`,
                          [doc.id],
                          { withCredentials: true },
                        );
                        fetchData();
                      }}
                    >
                      Restore
                    </button>
                    <img
                      src='/bin.png'
                      alt='Permanent Delete'
                      title='Permanently delete'
                      onClick={() =>
                        confirmThenRun(async () => {
                          await axios.delete(`${API_URL}/documents/bin/purge`, {
                            data: [doc.id],
                            withCredentials: true,
                          });
                          fetchData();
                        })
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmOpen && pendingAction && (
        <ConfimationModal
          onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
          onConfirm={() => {
            setConfirmOpen(false);
            pendingAction().catch(() => {});
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
};

export default Bin;
