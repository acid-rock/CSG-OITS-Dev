import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';

const API_URL = import.meta.env.VITE_API_URL as string;

interface CommitteeEntry {
  id: string;
  name: string;
}

const CommitteesPanel = () => {
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: res } = await axios.get<CommitteeEntry[]>(
        `${API_URL}/committees`,
        { withCredentials: true },
      );
      setData(res);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load committees.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setEditingId(null);
      await fetchData();
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to update committee.');
    }
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

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

      {fetchError && (
        <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>
      )}

      {/* Inline add form */}
      <div className='announce-toolbar'>
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
        {addError && <span style={{ color: 'red', fontSize: '0.85rem' }}>{addError}</span>}
        <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
          <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
        </button>
      </div>

      <div className='announce-file-table'>
        <table>
          <thead>
            <tr className='announce-table-header-light'>
              <th style={{ width: '60px' }}>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.id} className='announce-table-row'>
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
                  <div className='announce-file-btn-inner'>
                    {editingId === entry.id ? (
                      <>
                        <button
                          className='announce-add-btn'
                          style={{ padding: '0.2rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleEditSave(entry.id)}
                        >
                          Save
                        </button>
                        <button
                          className='btn btn-cancel'
                          style={{ padding: '0.2rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <img
                          src='/bin.png'
                          alt='Delete'
                          onClick={() => { setDeleteId(String(entry.id)); setIsModalOpen(true); }}
                        />
                        <img
                          src='/edit.png'
                          alt='Edit'
                          onClick={() => { setEditingId(entry.id); setEditName(entry.name); }}
                        />
                      </>
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
