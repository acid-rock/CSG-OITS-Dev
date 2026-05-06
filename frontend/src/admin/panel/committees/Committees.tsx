import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import { Archive, ArchiveRestore } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;

interface CommitteeEntry {
  id: string;
  name: string;
  archived_at?: string;
}

type Tab = 'active' | 'archived';

const CommitteesPanel = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<CommitteeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/committees?status=archived`
        : `${API_URL}/committees`;
      const { data: res } = await axios.get<CommitteeEntry[]>(endpoint, { withCredentials: true });
      setData(res);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load committees.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await axios.post(`${API_URL}/committees/add`, { name: newName.trim() }, { withCredentials: true });
      setNewName('');
      await fetchData();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add committee.');
    } finally {
      setAdding(false);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await axios.post(`${API_URL}/committees/edit`, { id, name: editName.trim() }, { withCredentials: true });
      setData(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
      setEditingId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Failed to update committee.');
      setFetchError(msg);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await axios.post(`${API_URL}/committees/archive`, { ids: [id] }, { withCredentials: true });
      setData(prev => prev.filter(c => c.id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to archive committee.';
      setFetchError(msg);
    }
  };

  const handleRestore = async (id: string) => {
    await axios.post(`${API_URL}/committees/restore`, { ids: [id] }, { withCredentials: true });
    setData(prev => prev.filter(c => c.id !== id));
    fetchData();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this committee? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/committees/delete`, { data: { ids: [id] }, withCredentials: true });
      setData(prev => prev.filter(c => c.id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Delete failed.';
      setFetchError(msg);
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedIds.length} committee(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id =>
        axios.post(`${API_URL}/committees/archive`, { ids: [id] }, { withCredentials: true })
      ));
      setData(prev => prev.filter(c => !selectedIds.includes(String(c.id))));
      setSelectedIds([]);
    } catch { setFetchError('Bulk archive failed.'); }
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
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
        <div className='announce-header'><span>Committees</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container'>
      <div className='announce-header'><span>Committees</span></div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setTab('archived')}>Archived</button>
      </div>

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      {/* Inline add form — active tab only */}
      <div className='announce-toolbar'>
        {tab === 'active' && (
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type='text'
              placeholder='New committee name'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button type='submit' className='announce-add-btn' disabled={adding}>
              {adding ? 'Adding...' : 'Add Committee'}
            </button>
          </form>
        )}
        {addError && <span style={{ color: 'red', fontSize: '0.85rem' }}>{addError}</span>}
        <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
          <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
        </button>
      </div>

      {selectedIds.length >= 1 && tab === 'active' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          padding: '0.625rem 1.25rem', background: '#f0f9ff',
          border: '1px solid #bae6fd', borderRadius: '8px',
          marginBottom: '1rem', width: '100%', boxSizing: 'border-box' as const,
        }}>
          <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 600, minWidth: '120px' }}>
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleBulkArchive}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                color: '#d97706', background: 'none',
                border: '1px solid #d97706', borderRadius: '6px',
                padding: '0.35rem 0.875rem', fontSize: '0.8rem',
                fontWeight: 500, cursor: 'pointer',
              }}
            >🗂 Archive</button>
          </div>
        </div>
      )}

      <div className='announce-file-table'>
        <table>
          <thead>
            <tr className='announce-table-header-light'>
              <th style={{ width: '40px', padding: '0.5rem' }}>
                {tab === 'active' && (
                  <input
                    type='checkbox'
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={e => setSelectedIds(e.target.checked ? data.map(c => String(c.id)) : [])}
                  />
                )}
              </th>
              <th style={{ width: '60px' }}>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className='announce-table-row'
                onMouseEnter={() => setHoveredRowId(String(entry.id))}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                <td style={{ padding: '0.5rem', verticalAlign: 'middle' }}>
                  {tab === 'active' && (
                    <input
                      type='checkbox'
                      checked={selectedIds.includes(String(entry.id))}
                      onChange={e => setSelectedIds(prev =>
                        e.target.checked ? [...prev, String(entry.id)] : prev.filter(id => id !== String(entry.id))
                      )}
                    />
                  )}
                </td>
                <td>{entry.id}</td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type='text'
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ width: '100%', padding: '0.25rem 0.5rem' }}
                      autoFocus
                    />
                  ) : (
                    entry.name
                  )}
                </td>
                <td className='announce-file-btn'>
                  {tab === 'active' ? (
                    editingId === entry.id ? (
                      <div className='announce-file-btn-inner'>
                        <button className='announce-add-btn' style={{ padding: '0.2rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleEditSave(entry.id)}>Save</button>
                        <button className='btn btn-cancel' style={{ padding: '0.2rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      hoveredRowId === String(entry.id) && (
                        <div className='announce-file-btn-inner'>
                          <button title='Archive' onClick={() => handleArchive(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                            <Archive size={16} />
                          </button>
                          <img src='/bin.png' alt='Delete' onClick={() => { setDeleteId(String(entry.id)); setIsModalOpen(true); }} />
                          <img src='/edit.png' alt='Edit' onClick={() => { setEditingId(entry.id); setEditName(entry.name); }} />
                        </div>
                      )
                    )
                  ) : (
                    <div className='announce-file-btn-inner'>
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
                    </div>
                  )}
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
            source='committee'
            id={deleteId}
            title='Delete Committee'
            message='This will delete the committee. Committees with assigned officers cannot be deleted.'
            onClose={() => setIsModalOpen(false)}
            onConfirm={fetchData}
          />
        </div>
      )}
    </div>
  );
};

export default CommitteesPanel;
