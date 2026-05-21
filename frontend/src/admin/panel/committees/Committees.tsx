import { useState, useEffect, useCallback, useRef } from 'react';
import '../_shared/admin-list.css';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { MiniAvatar } from '../_shared/atoms';
import { I } from '../_shared/icons';

const API_URL = import.meta.env.VITE_API_URL as string;

/** Extract error message from axios error — backend sends { error: "..." } not { message: "..." } */
function apiErr(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  return d?.error ?? d?.message ?? (err instanceof Error ? err.message : fallback);
}

interface CommitteeEntry {
  id: string;
  name: string;
  archived_at?: string;
  chair_name?: string | null;
  cover_image_path?: string | null;
  cover_image_url?: string | null;
}

interface OfficerEntry {
  id: string;
  full_name: string;
  position: string | string[];
  committee?: string | null;
  is_committee_official: boolean;
}

type Tab = 'active' | 'archived' | 'bin';

const CommitteesPanel = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<CommitteeEntry[]>([]);
  const [officers, setOfficers] = useState<OfficerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const ep = tab === 'archived'
        ? `${API_URL}/committees?status=archived`
        : tab === 'bin'
        ? `${API_URL}/committees/bin`
        : `${API_URL}/committees`;
      const [committeesRes, officersRes] = await Promise.all([
        axios.get<CommitteeEntry[]>(ep, { withCredentials: true }),
        axios.get<OfficerEntry[]>(`${API_URL}/officers`, { withCredentials: true }),
      ]);
      setData(committeesRes.data);
      setOfficers(officersRes.data);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : 'Failed to load committees.'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true); setAddError(null);
    try { await axios.post(`${API_URL}/committees/add`, { name: newName.trim() }, { withCredentials: true }); setNewName(''); await fetchData(); }
    catch (err: unknown) { setAddError(err instanceof Error ? err.message : 'Failed to add.'); }
    finally { setAdding(false); }
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;
    // committees.id is UUID — send raw string, never parseInt
    try {
      await axios.post(`${API_URL}/committees/edit`, { id, name: editName.trim() }, { withCredentials: true });
      setData(p => p.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
      setEditingId(null);
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Update failed.')); }
  };

  const handleArchive = async (id: string) => {
    try {
      await axios.post(`${API_URL}/committees/archive`, { ids: [id] }, { withCredentials: true });
      setData(p => p.filter(c => c.id !== id));
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Archive failed.')); }
  };

  const handleRestore = async (id: string) => {
    try {
      await axios.post(`${API_URL}/committees/restore`, { ids: [id] }, { withCredentials: true });
      fetchData();
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Restore failed.')); }
  };

  const handleMoveToBin = async (id: string) => {
    if (!window.confirm('Move to bin?')) return;
    try {
      await axios.post(`${API_URL}/committees/bin`, { ids: [id] }, { withCredentials: true });
      setData(p => p.filter(c => c.id !== id));
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Move to bin failed.')); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/committees/delete`, { data: { ids: [id] }, withCredentials: true });
      setData(p => p.filter(c => c.id !== id));
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Delete failed.')); }
  };

  const handleRestoreFromBin = async (id: string) => {
    try {
      await axios.post(`${API_URL}/committees/restore-from-bin`, { ids: [id] }, { withCredentials: true });
      setData(p => p.filter(c => c.id !== id));
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Restore failed.')); }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length || !window.confirm(`Archive ${selectedIds.length} committee(s)?`)) return;
    try {
      await axios.post(`${API_URL}/committees/archive`, { ids: selectedIds }, { withCredentials: true });
      fetchData(); setSelectedIds([]);
    }
    catch (err: unknown) { setFetchError(apiErr(err, 'Bulk archive failed.')); }
  };

  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };
  const toggleSelect = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── Cover image upload ────────────────────────────────────────────────────
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);

  const triggerCoverUpload = (id: string) => {
    setUploadingCoverId(id);
    coverInputRef.current?.click();
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingCoverId) return;
    // Reset input so re-selecting the same file triggers onChange again
    e.target.value = '';
    try {
      const fd = new FormData();
      fd.append('id', uploadingCoverId);
      fd.append('cover', file);
      const { data } = await axios.post<{ cover_image_url: string }>(
        `${API_URL}/committees/upload-cover`,
        fd,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setData(p => p.map(c => c.id === uploadingCoverId
        ? { ...c, cover_image_url: data.cover_image_url }
        : c
      ));
    } catch (err: unknown) { setFetchError(apiErr(err, 'Cover upload failed.')); }
    finally { setUploadingCoverId(null); }
  };

  const filtered = data.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /** Resolve the chair name for a committee: prefer DB field, fall back to officers.
   *  Both committees.id and officers.committee are UUIDs — direct string compare. */
  const resolveChair = (c: CommitteeEntry): string | null => {
    if (c.chair_name) return c.chair_name;
    const chair = officers.find(
      o => o.committee != null && String(o.committee) === c.id && o.is_committee_official
    );
    return chair ? chair.full_name : null;
  };

  /** Count officers assigned to this committee */
  const memberCount = (c: CommitteeEntry): number =>
    officers.filter(o => o.committee != null && String(o.committee) === c.id).length;


  return (
    <>
      <div className="ad-shell">
        <Sidebar active="committees" />
        <main className="ad-main">
          <PageHead
            title="Committees"
            subtitle="Create and assign chairs to CSG committees. Officers can be linked from the Officers page."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
            </>}
          />
          <Tabs items={[
            { label:'Active',   active: tab==='active',   count: tab==='active'   ? data.length : undefined },
            { label:'Archived', active: tab==='archived', count: tab==='archived' ? data.length : undefined },
            { label:'Bin',      active: tab==='bin',      count: tab==='bin'      ? data.length : undefined },
          ]} onTabChange={(l) => setTab(l.toLowerCase() as Tab)} />

          <Toolbar
            placeholder="Search committees by name or chair…"
            search={searchQuery} onSearch={setSearchQuery}
            showSort={false} onRefresh={handleRefresh}
          />

          {fetchError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{fetchError}</p>}

          {tab === 'active' && (
            <BulkBar count={selectedIds.length} actions={['Archive']} handlers={{ Archive: handleBulkArchive }} onClear={() => setSelectedIds([])} />
          )}

          {/* Add form (active tab only) */}
          {tab === 'active' && (
            <form onSubmit={handleAdd} style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="New committee name…"
                style={{ flex:1, padding:'9px 14px', border:'1px solid var(--color-border)', borderRadius:'var(--radius-input)', fontFamily:'inherit', fontSize:13 }}
              />
              <button type="submit" className="ad-btn-primary" disabled={adding}><I.plus width="14" height="14" />{adding ? 'Adding…' : 'Add'}</button>
              {addError && <span style={{fontSize:12,color:'var(--color-danger-text)'}}>{addError}</span>}
            </form>
          )}

          {/* Hidden file input shared across all rows */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverFileChange}
          />

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{width:44}}/><col style={{width:52}}/><col/><col style={{width:280}}/><col style={{width:140}}/><col style={{width:160}}/></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filtered.length>0&&filtered.every(c=>selectedIds.includes(c.id))} onChange={() => setSelectedIds(filtered.every(c=>selectedIds.includes(c.id)) ? [] : filtered.map(c=>c.id))} /></th>
                  <th>Cover</th>
                  <th>Committee</th><th>Chair</th><th>Members</th><th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length===0 && <tr><td colSpan={6}><div className="ad-empty"><p>{tab==='archived'?'No archived committees.':'No committees yet.'}</p></div></td></tr>}
                  {filtered.map(c => (
                    <tr key={c.id} className={selectedIds.includes(c.id) ? 'is-selected' : ''}>
                      <td><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                      <td>
                        {/* Cover image thumbnail */}
                        <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', background:'var(--color-bg-subtle)', flexShrink:0 }}>
                          {c.cover_image_url
                            ? <img src={c.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--color-text-hint)', fontWeight:700 }}>—</div>
                          }
                        </div>
                      </td>
                      <td>
                        {editingId === c.id ? (
                          <form onSubmit={e => { e.preventDefault(); handleEditSave(c.id); }} style={{display:'flex',gap:8}}>
                            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} style={{flex:1,padding:'6px 10px',border:'1.5px solid var(--color-primary)',borderRadius:8,fontFamily:'inherit',fontSize:13}} />
                            <button type="submit" className="ad-icon-btn is-on" title="Save"><I.check width="13" height="13" /></button>
                            <button type="button" className="ad-icon-btn" title="Cancel" onClick={() => setEditingId(null)}><I.x width="13" height="13" /></button>
                          </form>
                        ) : (
                          <a className="ad-title-link">{c.name}</a>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const chair = resolveChair(c);
                          return chair
                            ? <div className="ad-author"><MiniAvatar name={chair} /><span>{chair}</span></div>
                            : <span className="ad-cell-muted">—</span>;
                        })()}
                      </td>
                      <td>
                        <span className="ad-pill-stat">
                          {memberCount(c)} {memberCount(c) === 1 ? 'member' : 'members'}
                        </span>
                      </td>
                      <td className="ad-actions">
                        {tab === 'active' && <>
                          <button
                            className="ad-icon-btn"
                            title={c.cover_image_url ? 'Replace cover photo' : 'Upload cover photo'}
                            onClick={() => triggerCoverUpload(c.id)}
                            disabled={uploadingCoverId === c.id}
                          >
                            {uploadingCoverId === c.id
                              ? <I.refresh width="14" height="14" style={{animation:'spin 1s linear infinite'}} />
                              : <I.upload width="14" height="14" />
                            }
                          </button>
                          <button className="ad-icon-btn" title="Edit name" onClick={() => { setEditingId(c.id); setEditName(c.name); }}><I.edit width="14" height="14" /></button>
                          <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(c.id)}><I.archive width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleMoveToBin(c.id)}><I.trash width="14" height="14" /></button>
                        </>}
                        {tab === 'archived' && <>
                          <button className="ad-icon-btn is-on" title="Restore to Active" onClick={() => handleRestore(c.id)}><I.restore width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleMoveToBin(c.id)}><I.trash width="14" height="14" /></button>
                        </>}
                        {tab === 'bin' && <>
                          <button className="ad-icon-btn is-on" title="Restore to Active" onClick={() => handleRestoreFromBin(c.id)}><I.restore width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Delete Permanently" onClick={() => handleDelete(c.id)}><I.trash width="14" height="14" /></button>
                        </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TableFoot shown={`1–${filtered.length}`} total={filtered.length} label="committees" />
            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default CommitteesPanel;
