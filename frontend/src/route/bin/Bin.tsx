import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

const API_URL = import.meta.env.VITE_API_URL as string;

interface BinDocument { id: string; name: string; description: string; thumbnail?: string; deleted_at: string; }
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

type ItemType = 'doc' | 'ann' | 'event' | 'officer';
interface SelectedItem { type: ItemType; id: string; }
type BinTab = 'deleted' | 'archived';

const Bin = () => {
  const [binTab, setBinTab] = useState<BinTab>('deleted');

  // Deleted state
  const [docs, setDocs] = useState<BinDocument[]>([]);
  const [announcements, setAnnouncements] = useState<BinAnnouncement[]>([]);
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [officers, setOfficers] = useState<BinOfficer[]>([]);

  // Archived state
  const [archivedDocs, setArchivedDocs] = useState<BinDocument[]>([]);
  const [archivedAnns, setArchivedAnns] = useState<BinAnnouncement[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<BinEvent[]>([]);
  const [archivedOfficers, setArchivedOfficers] = useState<BinOfficer[]>([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Multi-select (deleted tab only)
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  useLockBodyScroll(confirmBulkDelete);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setSelected([]);
    const ts = Date.now();
    try {
      const [docsRes, annRes, eventsRes, officersRes,
             aDocsRes, aAnnRes, aEventsRes, aOfficersRes] = await Promise.allSettled([
        axios.get(`${API_URL}/documents/bin?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/announcements/bin?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/events/bin?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/officers?status=archived&t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/documents/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/announcements/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/events/archived?t=${ts}`, { withCredentials: true }),
        axios.get(`${API_URL}/officers?status=archived&t=${ts}`, { withCredentials: true }),
      ]);
      if (docsRes.status === 'fulfilled') setDocs(docsRes.value.data);
      if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (officersRes.status === 'fulfilled') setOfficers(officersRes.value.data);
      if (aDocsRes.status === 'fulfilled') setArchivedDocs(aDocsRes.value.data);
      if (aAnnRes.status === 'fulfilled') setArchivedAnns(aAnnRes.value.data);
      if (aEventsRes.status === 'fulfilled') setArchivedEvents(aEventsRes.value.data);
      if (aOfficersRes.status === 'fulfilled') setArchivedOfficers(aOfficersRes.value.data);
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

  const toggleSelect = (type: ItemType, id: string) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.type === type && s.id === id);
      return exists ? prev.filter((s) => !(s.type === type && s.id === id)) : [...prev, { type, id }];
    });
  };

  const isSelected = (type: ItemType, id: string) => selected.some((s) => s.type === type && s.id === id);

  const clearSelection = () => setSelected([]);

  const bulkRestore = async () => {
    const docIds = selected.filter((s) => s.type === 'doc').map((s) => s.id);
    const annIds = selected.filter((s) => s.type === 'ann').map((s) => s.id);
    const eventIds = selected.filter((s) => s.type === 'event').map((s) => s.id);
    const officerIds = selected.filter((s) => s.type === 'officer').map((s) => s.id);

    await Promise.allSettled([
      docIds.length && axios.post(`${API_URL}/documents/restore-from-bin`, { ids: docIds }, { withCredentials: true }),
      annIds.length && axios.post(`${API_URL}/announcements/restore-from-bin`, { ids: annIds }, { withCredentials: true }),
      eventIds.length && axios.post(`${API_URL}/events/restore-from-bin`, { ids: eventIds }, { withCredentials: true }),
      officerIds.length && axios.post(`${API_URL}/officers/restore`, { ids: officerIds }, { withCredentials: true }),
    ]);

    if (docIds.length) setDocs((prev) => prev.filter((d) => !docIds.includes(d.id)));
    if (annIds.length) setAnnouncements((prev) => prev.filter((a) => !annIds.includes(a.id)));
    if (eventIds.length) setEvents((prev) => prev.filter((e) => !eventIds.includes(e.id)));
    if (officerIds.length) setOfficers((prev) => prev.filter((o) => !officerIds.includes(o.id)));
    clearSelection();
  };

  const bulkDelete = async () => {
    const docIds = selected.filter((s) => s.type === 'doc').map((s) => s.id);
    const annIds = selected.filter((s) => s.type === 'ann').map((s) => s.id);
    const eventIds = selected.filter((s) => s.type === 'event').map((s) => s.id);
    const officerIds = selected.filter((s) => s.type === 'officer').map((s) => s.id);

    await Promise.allSettled([
      docIds.length && axios.delete(`${API_URL}/documents/bin/purge`, { data: docIds, withCredentials: true }),
      annIds.length && axios.delete(`${API_URL}/announcements/delete`, { data: annIds.map((id) => ({ id })), withCredentials: true }),
      eventIds.length && Promise.all(eventIds.map((id) => axios.delete(`${API_URL}/events/delete`, { data: { id }, withCredentials: true }))),
      officerIds.length && axios.delete(`${API_URL}/officers/delete`, { data: { ids: officerIds }, withCredentials: true }),
    ]);

    if (docIds.length) setDocs((prev) => prev.filter((d) => !docIds.includes(d.id)));
    if (annIds.length) setAnnouncements((prev) => prev.filter((a) => !annIds.includes(a.id)));
    if (eventIds.length) setEvents((prev) => prev.filter((e) => !eventIds.includes(e.id)));
    if (officerIds.length) setOfficers((prev) => prev.filter((o) => !officerIds.includes(o.id)));
    clearSelection();
    setConfirmBulkDelete(false);
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

  const tabStyle = (t: BinTab) => ({
    padding: '0.35rem 1rem', border: 'none',
    borderBottom: binTab === t ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'none', cursor: 'pointer',
    fontWeight: binTab === t ? 600 : 400,
    color: binTab === t ? '#3b82f6' : '#6b7280', fontSize: '0.9rem',
  });

  return (
    <div className='announce-container' style={{ overflowY: 'auto' }}>
      <div className='announce-header'><span>Bin</span></div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('deleted')} onClick={() => setBinTab('deleted')}>Deleted</button>
        <button style={tabStyle('archived')} onClick={() => setBinTab('archived')}>Archived</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>
          {binTab === 'deleted' ? `${totalCount} items` : `${archivedDocs.length + archivedAnns.length + archivedEvents.length + archivedOfficers.length} archived`}
        </span>
        <div className='announce-toolbar-actions'>
          <button className='announce-action-btn announce-refresh-btn' title='Refresh' onClick={handleRefresh}>
            <img src='/refresh.png' alt='refresh' className={spinning ? 'announce-spin refresh-img' : 'refresh-img'} />
          </button>
        </div>
      </div>

      {binTab === 'deleted' && (
        <p style={{ padding: '0.25rem 1rem', fontSize: '0.8rem', color: '#888' }}>
          Items here will be eligible for permanent deletion after 30 days.
        </p>
      )}
      {binTab === 'archived' && (
        <p style={{ padding: '0.25rem 1rem', fontSize: '0.8rem', color: '#888' }}>
          Archived records are preserved permanently and never auto-purged.
        </p>
      )}

      {binTab === 'deleted' && <>

      {/* Floating action bar */}
      {selected.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b', color: '#fff', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', borderRadius: 6, margin: '0 0 0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selected.length} item{selected.length !== 1 ? 's' : ''} selected</span>
          <button onClick={bulkRestore} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Restore All</button>
          <button onClick={() => setConfirmBulkDelete(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete All Permanently</button>
          <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>× Clear</button>
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Documents ({docs.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th><input type='checkbox' title='Select All Docs' checked={docs.every((d) => isSelected('doc', d.id))} onChange={() => { if (docs.every((d) => isSelected('doc', d.id))) { setSelected((p) => p.filter((s) => s.type !== 'doc')); } else { setSelected((p) => [...p.filter((s) => s.type !== 'doc'), ...docs.map((d) => ({ type: 'doc' as ItemType, id: d.id }))]); } }} /></th>
                  <th>File Name</th><th>Description</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className='announce-table-row' onMouseEnter={() => setHoveredRowId(doc.id)} onMouseLeave={() => setHoveredRowId(null)}>
                    <td><input type='checkbox' checked={isSelected('doc', doc.id)} onChange={() => toggleSelect('doc', doc.id)} /></td>
                    <td>{doc.name}</td>
                    <td>{doc.description}</td>
                    <td>{fmt(doc.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === doc.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore} onClick={async () => { try { await axios.post(`${API_URL}/documents/restore-from-bin`, { ids: [doc.id] }, { withCredentials: true }); setDocs((p) => p.filter((d) => d.id !== doc.id)); } catch { setFetchError('Restore failed.'); } }}>Restore</button>
                          <button style={btnDelete} onClick={async () => { try { await axios.delete(`${API_URL}/documents/bin/purge`, { data: [doc.id], withCredentials: true }); setDocs((p) => p.filter((d) => d.id !== doc.id)); } catch { setFetchError('Delete failed.'); } }}>Delete</button>
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

      {/* Announcements */}
      {announcements.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Announcements ({announcements.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th><input type='checkbox' title='Select All Announcements' checked={announcements.every((a) => isSelected('ann', a.id))} onChange={() => { if (announcements.every((a) => isSelected('ann', a.id))) { setSelected((p) => p.filter((s) => s.type !== 'ann')); } else { setSelected((p) => [...p.filter((s) => s.type !== 'ann'), ...announcements.map((a) => ({ type: 'ann' as ItemType, id: a.id }))]); } }} /></th>
                  <th>Title</th><th>Content</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className='announce-table-row' onMouseEnter={() => setHoveredRowId(a.id)} onMouseLeave={() => setHoveredRowId(null)}>
                    <td><input type='checkbox' checked={isSelected('ann', a.id)} onChange={() => toggleSelect('ann', a.id)} /></td>
                    <td>{a.title}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.content}</td>
                    <td>{fmt(a.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === a.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore} onClick={async () => { try { await axios.post(`${API_URL}/announcements/restore-from-bin`, { ids: [a.id] }, { withCredentials: true }); setAnnouncements((p) => p.filter((x) => x.id !== a.id)); } catch { setFetchError('Restore failed.'); } }}>Restore</button>
                          <button style={btnDelete} onClick={async () => { try { await axios.delete(`${API_URL}/announcements/delete`, { data: [{ id: a.id }], withCredentials: true }); setAnnouncements((p) => p.filter((x) => x.id !== a.id)); } catch { setFetchError('Delete failed.'); } }}>Delete</button>
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

      {/* Events */}
      {events.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Events ({events.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th><input type='checkbox' title='Select All Events' checked={events.every((e) => isSelected('event', e.id))} onChange={() => { if (events.every((e) => isSelected('event', e.id))) { setSelected((p) => p.filter((s) => s.type !== 'event')); } else { setSelected((p) => [...p.filter((s) => s.type !== 'event'), ...events.map((e) => ({ type: 'event' as ItemType, id: e.id }))]); } }} /></th>
                  <th>Name</th><th>Description</th><th>Deleted At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className='announce-table-row' onMouseEnter={() => setHoveredRowId(e.id)} onMouseLeave={() => setHoveredRowId(null)}>
                    <td><input type='checkbox' checked={isSelected('event', e.id)} onChange={() => toggleSelect('event', e.id)} /></td>
                    <td>{e.name}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                    <td>{fmt(e.deleted_at)}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === e.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore} onClick={async () => { try { await axios.post(`${API_URL}/events/restore-from-bin`, { ids: [e.id] }, { withCredentials: true }); setEvents((p) => p.filter((x) => x.id !== e.id)); } catch { setFetchError('Restore failed.'); } }}>Restore</button>
                          <button style={btnDelete} onClick={async () => { try { await axios.delete(`${API_URL}/events/delete`, { data: { id: e.id }, withCredentials: true }); setEvents((p) => p.filter((x) => x.id !== e.id)); } catch { setFetchError('Delete failed.'); } }}>Delete</button>
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

      {/* Officers */}
      {officers.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
            Archived Officers ({officers.length})
          </h3>
          <div className='announce-file-table' style={{ maxHeight: '320px' }}>
            <table>
              <thead>
                <tr className='announce-table-header-light'>
                  <th><input type='checkbox' title='Select All Officers' checked={officers.every((o) => isSelected('officer', o.id))} onChange={() => { if (officers.every((o) => isSelected('officer', o.id))) { setSelected((p) => p.filter((s) => s.type !== 'officer')); } else { setSelected((p) => [...p.filter((s) => s.type !== 'officer'), ...officers.map((o) => ({ type: 'officer' as ItemType, id: o.id }))]); } }} /></th>
                  <th>Name</th><th>Position</th><th>Term</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id} className='announce-table-row' onMouseEnter={() => setHoveredRowId(o.id)} onMouseLeave={() => setHoveredRowId(null)}>
                    <td><input type='checkbox' checked={isSelected('officer', o.id)} onChange={() => toggleSelect('officer', o.id)} /></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><img src={o.avatar || '/CSG_logo.svg'} alt={o.full_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/CSG_logo.svg'; }} />{o.full_name}</div></td>
                    <td>{Array.isArray(o.position) ? o.position[0] : o.position}</td>
                    <td>{o.year_serving ?? '—'}</td>
                    <td className='announce-file-btn'>
                      {hoveredRowId === o.id && (
                        <div className='announce-file-btn-inner'>
                          <button style={btnRestore} onClick={async () => { try { await axios.post(`${API_URL}/officers/restore`, { ids: [o.id] }, { withCredentials: true }); setOfficers((p) => p.filter((x) => x.id !== o.id)); } catch { setFetchError('Restore failed.'); } }}>Restore</button>
                          <button style={btnDelete} onClick={async () => { try { await axios.delete(`${API_URL}/officers/delete`, { data: { ids: [o.id] }, withCredentials: true }); setOfficers((p) => p.filter((x) => x.id !== o.id)); } catch { setFetchError('Delete failed.'); } }}>Delete</button>
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

      {/* Bulk delete confirmation */}
      {confirmBulkDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 400, width: '92%', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Delete {selected.length} items permanently?</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmBulkDelete(false)} style={{ padding: '0.6rem 1.5rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={bulkDelete} style={{ padding: '0.6rem 1.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      </>} {/* end binTab === 'deleted' */}

      {binTab === 'archived' && <>
        {/* Archived Announcements */}
        {archivedAnns.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>Announcements ({archivedAnns.length})</h3>
            <div className='announce-file-table'>
              <table>
                <thead><tr className='announce-table-header-light'><th>Title</th><th>Actions</th></tr></thead>
                <tbody>
                  {archivedAnns.map((a) => (
                    <tr key={a.id} className='announce-table-row'>
                      <td>{a.title}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <button style={btnRestore} onClick={async () => { await axios.post(`${API_URL}/announcements/restore`, { ids: [a.id] }, { withCredentials: true }); setArchivedAnns((p) => p.filter((x) => x.id !== a.id)); }}>Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {/* Archived Documents */}
        {archivedDocs.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>Documents ({archivedDocs.length})</h3>
            <div className='announce-file-table'>
              <table>
                <thead><tr className='announce-table-header-light'><th>Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {archivedDocs.map((d) => (
                    <tr key={d.id} className='announce-table-row'>
                      <td>{d.name}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <button style={btnRestore} onClick={async () => { await axios.post(`${API_URL}/documents/restore`, { ids: [d.id] }, { withCredentials: true }); setArchivedDocs((p) => p.filter((x) => x.id !== d.id)); }}>Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {/* Archived Events */}
        {archivedEvents.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>Events ({archivedEvents.length})</h3>
            <div className='announce-file-table'>
              <table>
                <thead><tr className='announce-table-header-light'><th>Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {archivedEvents.map((e) => (
                    <tr key={e.id} className='announce-table-row'>
                      <td>{e.name}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <button style={btnRestore} onClick={async () => { await axios.post(`${API_URL}/events/restore`, { ids: [e.id] }, { withCredentials: true }); setArchivedEvents((p) => p.filter((x) => x.id !== e.id)); }}>Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {/* Archived Officers */}
        {archivedOfficers.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', margin: 0 }}>Archived Officers ({archivedOfficers.length})</h3>
            <div className='announce-file-table'>
              <table>
                <thead><tr className='announce-table-header-light'><th>Name</th><th>Position</th><th>Term</th><th>Actions</th></tr></thead>
                <tbody>
                  {archivedOfficers.map((o) => (
                    <tr key={o.id} className='announce-table-row'>
                      <td>{o.full_name}</td>
                      <td>{Array.isArray(o.position) ? o.position[0] : o.position}</td>
                      <td>{o.year_serving ?? '—'}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <button style={btnRestore} onClick={async () => { await axios.post(`${API_URL}/officers/restore`, { ids: [o.id] }, { withCredentials: true }); setArchivedOfficers((p) => p.filter((x) => x.id !== o.id)); }}>Restore</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {(archivedDocs.length + archivedAnns.length + archivedEvents.length + archivedOfficers.length) === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No archived records.</p>
        )}
      </>} {/* end binTab === 'archived' */}

    </div>
  );
};

export default Bin;
