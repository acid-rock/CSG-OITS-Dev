import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConfimationModal from '../../admin/components/modals/confirmationModal/ConfimationModal';

const API_URL = import.meta.env.VITE_API_URL as string;

interface BinDocument { id: string; name: string; description: string; thumbnail: string; deleted_at: string; }
interface BinAnnouncement { id: string; title: string; content: string; deleted_at: string; }
interface BinEvent { id: string; name: string; description: string; deleted_at: string; }
interface BinOfficer { id: string; full_name: string; position: string | string[]; year_serving?: string; avatar?: string; }

const fmt = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const btnRestore: React.CSSProperties = {
  background: 'none', border: '1px solid #16a34a', color: '#16a34a',
  borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
};
const btnDelete: React.CSSProperties = {
  background: 'none', border: '1px solid #dc2626', color: '#dc2626',
  borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
};

const Bin = () => {
  const [docs, setDocs] = useState<BinDocument[]>([]);
  const [announcements, setAnnouncements] = useState<BinAnnouncement[]>([]);
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [officers, setOfficers] = useState<BinOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const ts = Date.now();
    try {
      const [docsRes, annRes, eventsRes, officersRes] = await Promise.allSettled([
        axios.get(`${API_URL}/documents/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/announcements/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/events/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/officers?status=archived&t=${ts}`, { withCredentials: true }),
      ]);
      if (docsRes.status === 'fulfilled') setDocs(docsRes.value.data);
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (officersRes.status === 'fulfilled') setOfficers(officersRes.value.data);
    } catch {
      setFetchError('Failed to load bin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => {
    setSpinning(true);
    fetchAll().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const confirmThenRun = (action: () => Promise<void>) => {
    setPendingAction(() => action);
    setConfirmOpen(true);
  };

  const totalCount = docs.length + announcements.length + events.length + officers.length;

  if (loading) {
    return (
      <div className='announce-container' style={{ overflowY: 'auto' }}>
        <div className='announce-header'><span>Bin</span></div>
        <p style={{ padding: '1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className='announce-container' style={{ overflowY: 'auto' }}>
      <div className='announce-header'><span>Bin</span></div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{totalCount} items in bin</span>
        <div className='announce-toolbar-actions'>
          <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
            <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
          </button>
        </div>
      </div>

      <p style={{ padding: '0.25rem 1rem', fontSize: '0.8rem', color: '#888' }}>
        Items here can be restored. Documents older than 30 days are eligible for permanent purge.
      </p>

      {/* ── Documents ── */}
      {docs.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Documents ({docs.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th>Thumbnail</th><th>File Name</th><th>Description</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className='announce-table-row'
                    onMouseEnter={() => setHoveredRowId(doc.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>{doc.thumbnail ? <img src={doc.thumbnail} alt={doc.name} style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '—'}</td>
                    <td>{doc.name}</td>
                    <td>{doc.description}</td>
                    <td>{fmt(doc.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === doc.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore}
                            onClick={async () => {
                              try {
                                await axios.post(`${API_URL}/documents/restore`, { ids: [doc.id] }, { withCredentials: true });
                                setDocs(prev => prev.filter(d => d.id !== doc.id));
                              } catch { setFetchError('Restore failed.'); }
                            }}
                          >Restore</button>
                          <button style={btnDelete}
                            onClick={() => confirmThenRun(async () => {
                              await axios.delete(`${API_URL}/documents/bin/purge`, { data: [doc.id], withCredentials: true });
                              setDocs(prev => prev.filter(d => d.id !== doc.id));
                            })}
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Announcements ── */}
      {announcements.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Announcements ({announcements.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th>Title</th><th>Content</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className='announce-table-row'
                    onMouseEnter={() => setHoveredRowId(a.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>{a.title}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.content}</td>
                    <td>{fmt(a.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === a.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore}
                            onClick={async () => {
                              try {
                                await axios.post(`${API_URL}/announcements/restore`, { ids: [a.id] }, { withCredentials: true });
                                setAnnouncements(prev => prev.filter(x => x.id !== a.id));
                              } catch { setFetchError('Restore failed.'); }
                            }}
                          >Restore</button>
                          <button style={btnDelete}
                            onClick={() => confirmThenRun(async () => {
                              await axios.delete(`${API_URL}/announcements/delete`, { data: [{ id: a.id }], withCredentials: true });
                              setAnnouncements(prev => prev.filter(x => x.id !== a.id));
                            })}
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Events ── */}
      {events.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Events ({events.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th>Name</th><th>Description</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className='announce-table-row'
                    onMouseEnter={() => setHoveredRowId(e.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>{e.name}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                    <td>{fmt(e.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === e.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore}
                            onClick={async () => {
                              try {
                                await axios.post(`${API_URL}/events/restore`, { ids: [e.id] }, { withCredentials: true });
                                setEvents(prev => prev.filter(x => x.id !== e.id));
                              } catch { setFetchError('Restore failed.'); }
                            }}
                          >Restore</button>
                          <button style={btnDelete}
                            onClick={() => confirmThenRun(async () => {
                              await axios.delete(`${API_URL}/events/delete`, { data: { id: e.id }, withCredentials: true });
                              setEvents(prev => prev.filter(x => x.id !== e.id));
                            })}
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Officers (Archived) ── */}
      {officers.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Officers (Archived) ({officers.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th>Name</th><th>Position</th><th>Term</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id} className='announce-table-row'
                    onMouseEnter={() => setHoveredRowId(o.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={o.avatar || '/CSG_logo.svg'} alt={o.full_name}
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = '/CSG_logo.svg'; }}
                        />
                        {o.full_name}
                      </div>
                    </td>
                    <td>{Array.isArray(o.position) ? o.position[0] : o.position}</td>
                    <td>{o.year_serving ?? '—'}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === o.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore}
                            onClick={async () => {
                              try {
                                await axios.post(`${API_URL}/officers/restore`, { ids: [o.id] }, { withCredentials: true });
                                setOfficers(prev => prev.filter(x => x.id !== o.id));
                              } catch { setFetchError('Restore failed.'); }
                            }}
                          >Restore</button>
                          <button style={btnDelete}
                            onClick={() => confirmThenRun(async () => {
                              await axios.delete(`${API_URL}/officers/delete`, { data: { ids: [o.id] }, withCredentials: true });
                              setOfficers(prev => prev.filter(x => x.id !== o.id));
                            })}
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalCount === 0 && (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>The bin is empty.</p>
      )}

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
