import { useState, useEffect, useCallback, useRef } from 'react';
import '../_shared/admin-list.css';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { MiniAvatar } from '../_shared/atoms';
import { I } from '../_shared/icons';

const API_URL = import.meta.env.VITE_API_URL as string;

function apiErr(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  return d?.error ?? d?.message ?? (err instanceof Error ? err.message : fallback);
}

interface CommitteeEntry {
  id: string;
  name: string;
  archived_at?: string;
  chair_name?: string | null;
  vice_chair_name?: string | null;
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

// ── Edit Details Modal ────────────────────────────────────────────────────────

interface EditModalProps {
  committee: CommitteeEntry;
  officerSuggestions: string[];
  onClose: () => void;
  onSaved: (updated: Partial<CommitteeEntry>) => void;
}

function EditDetailsModal({ committee, officerSuggestions, onClose, onSaved }: EditModalProps) {
  const [name,       setName]       = useState(committee.name);
  const [chairName,  setChairName]  = useState(committee.chair_name ?? '');
  const [viceChair,  setViceChair]  = useState(committee.vice_chair_name ?? '');
  const [coverFile,  setCoverFile]  = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(committee.cover_image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const r = new FileReader();
    r.onloadend = () => setCoverPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Committee name is required.'); return; }
    setSaving(true); setError(null);
    try {
      await axios.post(`${API_URL}/committees/edit`, {
        id: committee.id,
        name: name.trim(),
        chair_name:      chairName.trim()  || null,
        vice_chair_name: viceChair.trim()  || null,
      }, { withCredentials: true });

      let newCoverUrl = committee.cover_image_url;
      if (coverFile) {
        const fd = new FormData();
        fd.append('id', committee.id);
        fd.append('cover', coverFile);
        const { data } = await axios.post<{ cover_image_url: string }>(
          `${API_URL}/committees/upload-cover`, fd,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        );
        newCoverUrl = data.cover_image_url;
      }

      onSaved({ name: name.trim(), chair_name: chairName.trim()||null, vice_chair_name: viceChair.trim()||null, cover_image_url: newCoverUrl });
      onClose();
    } catch (err: unknown) {
      setError(apiErr(err, 'Save failed.'));
    } finally { setSaving(false); }
  };

  const datalistId = `officers-${committee.id}`;

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-form-card ad-form-card--md" onClick={e => e.stopPropagation()}>
        <div className="ad-form-header">
          <span className="ad-form-header-title">Edit Committee Details</span>
          <button className="ad-form-close" onClick={onClose}><I.x width="14" height="14" /></button>
        </div>

        <form onSubmit={handleSave} className="ad-form-body">
          {/* Cover photo */}
          <label className="ad-field">
            Cover Photo
            <div className="ad-upload-zone" onClick={() => fileRef.current?.click()}>
              {coverPreview && <img src={coverPreview} alt="cover" className="ad-upload-preview" />}
              {!coverPreview && (
                <div className="ad-upload-zone-label">
                  <I.upload width="22" height="22" />
                  <span>Click to upload a cover photo</span>
                </div>
              )}
              <span className="ad-upload-badge">{coverPreview ? 'Click to replace' : 'PNG, JPG'}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleCoverChange} />
          </label>

          {/* Committee name */}
          <label className="ad-field">
            Committee Name *
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Committee on Academic Affairs" />
          </label>

          <datalist id={datalistId}>
            {officerSuggestions.map(n => <option key={n} value={n} />)}
          </datalist>

          {/* Chair */}
          <div className="ad-field">
            <label className="ad-field-label">Chairperson</label>
            <input value={chairName} onChange={e => setChairName(e.target.value)} list={datalistId} placeholder="Name of chairperson (or leave blank)" />
            {officerSuggestions.length > 0 && (
              <span className="ad-field-hint">Suggestions from officers assigned to this committee ↑</span>
            )}
          </div>

          {/* Vice chair */}
          <label className="ad-field">
            Vice Chairperson
            <input value={viceChair} onChange={e => setViceChair(e.target.value)} list={datalistId} placeholder="Name of vice chairperson (or leave blank)" />
          </label>

          {error && <p className="ad-field-error">{error}</p>}

          <div className="ad-form-actions">
            <button type="button" className="ad-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ad-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Committee Modal ───────────────────────────────────────────────────────

function AddCommitteeModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: CommitteeEntry) => void }) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Committee name is required.'); return; }
    setAdding(true); setError(null);
    try {
      const { data } = await axios.post<CommitteeEntry>(`${API_URL}/committees/add`, { name: name.trim() }, { withCredentials: true });
      onAdded(data);
      onClose();
    } catch (err: unknown) { setError(apiErr(err, 'Failed to add.')); }
    finally { setAdding(false); }
  };

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-form-card ad-form-card--sm" onClick={e => e.stopPropagation()}>
        <div className="ad-form-header">
          <span className="ad-form-header-title">New Committee</span>
          <button className="ad-form-close" onClick={onClose}><I.x width="14" height="14" /></button>
        </div>
        <form onSubmit={handleAdd} className="ad-form-body">
          <label className="ad-field">
            Committee Name *
            <input autoFocus value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Committee on Academic Affairs" />
          </label>
          {error && <p className="ad-field-error">{error}</p>}
          <div className="ad-form-actions">
            <button type="button" className="ad-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ad-btn-primary" disabled={adding}>{adding ? 'Adding…' : 'Add committee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

const CommitteesPanel = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<CommitteeEntry[]>([]);
  const [officers, setOfficers] = useState<OfficerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [editTarget, setEditTarget] = useState<CommitteeEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const ep = tab === 'archived' ? `${API_URL}/committees?status=archived`
        : tab === 'bin' ? `${API_URL}/committees/bin`
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

  const handleArchive = async (id: string) => {
    try { await axios.post(`${API_URL}/committees/archive`, { ids:[id] }, { withCredentials:true }); setData(p => p.filter(c => c.id !== id)); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Archive failed.')); }
  };
  const handleRestore = async (id: string) => {
    try { await axios.post(`${API_URL}/committees/restore`, { ids:[id] }, { withCredentials:true }); fetchData(); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Restore failed.')); }
  };
  const handleMoveToBin = async (id: string) => {
    const count = memberCount({ id } as CommitteeEntry);
    if (count > 0) { setFetchError(`Cannot move to bin: this committee has ${count} active member(s). Reassign them first.`); return; }
    if (!window.confirm('Move to bin?')) return;
    try { await axios.post(`${API_URL}/committees/bin`, { ids:[id] }, { withCredentials:true }); setData(p => p.filter(c => c.id !== id)); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Move to bin failed.')); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete? This cannot be undone.')) return;
    try { await axios.delete(`${API_URL}/committees/delete`, { data:{ ids:[id] }, withCredentials:true }); setData(p => p.filter(c => c.id !== id)); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Delete failed.')); }
  };
  const handleRestoreFromBin = async (id: string) => {
    try { await axios.post(`${API_URL}/committees/restore-from-bin`, { ids:[id] }, { withCredentials:true }); setData(p => p.filter(c => c.id !== id)); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Restore failed.')); }
  };
  const handleBulkArchive = async () => {
    if (!selectedIds.length || !window.confirm(`Archive ${selectedIds.length} committee(s)?`)) return;
    try { await axios.post(`${API_URL}/committees/archive`, { ids:selectedIds }, { withCredentials:true }); fetchData(); setSelectedIds([]); }
    catch (err: unknown) { setFetchError(apiErr(err, 'Bulk archive failed.')); }
  };

  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };
  const toggleSelect = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const filtered = data.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const resolveChair = (c: CommitteeEntry): { name: string; avatar?: string | null } | null => {
    if (c.chair_name) return { name: c.chair_name };
    const chair = officers.find(o => o.committee != null && String(o.committee) === c.id && o.is_committee_official);
    return chair ? { name: chair.full_name } : null;
  };

  const memberCount = (c: CommitteeEntry): number =>
    officers.filter(o => o.committee != null && String(o.committee) === c.id).length;

  const committeeSuggestions = (c: CommitteeEntry): string[] =>
    officers.filter(o => o.committee != null && String(o.committee) === c.id).map(o => o.full_name).filter(Boolean);

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="committees" />
        <main className="ad-main">
          <PageHead
            title="Committees"
            subtitle="Create and manage CSG committees. Assign chairpersons, vice chairs, and cover photos."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {tab === 'active' && <button className="ad-btn-primary" onClick={() => setAddOpen(true)}><I.plus width="14" height="14" />New committee</button>}
            </>}
          />

          <Tabs items={[
            { label:'Active',   active: tab==='active',   count: tab==='active'   ? data.length : undefined },
            { label:'Archived', active: tab==='archived', count: tab==='archived' ? data.length : undefined },
            { label:'Bin',      active: tab==='bin',      count: tab==='bin'      ? data.length : undefined },
          ]} onTabChange={l => setTab(l.toLowerCase() as Tab)} />

          <Toolbar placeholder="Search committees…" search={searchQuery} onSearch={setSearchQuery} showSort={false} onRefresh={handleRefresh} />

          {fetchError && <p style={{ fontSize:13, color:'var(--color-danger-text)', margin:0 }}>{fetchError}</p>}
          {tab === 'active' && <BulkBar count={selectedIds.length} actions={['Archive']} handlers={{ Archive: handleBulkArchive }} onClear={() => setSelectedIds([])} />}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{width:44}}/><col style={{width:52}}/><col/><col style={{width:240}}/><col style={{width:130}}/><col style={{width:150}}/></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filtered.length>0&&filtered.every(c=>selectedIds.includes(c.id))} onChange={()=>setSelectedIds(filtered.every(c=>selectedIds.includes(c.id))?[]:filtered.map(c=>c.id))} /></th>
                  <th>Cover</th><th>Committee</th><th>Officials</th><th>Members</th><th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length===0 && <tr><td colSpan={6}><div className="ad-empty"><p>{tab==='archived'?'No archived committees.':'No committees yet.'}</p></div></td></tr>}
                  {filtered.map(c => {
                    const chair     = resolveChair(c);
                    const viceChair = c.vice_chair_name?.trim() || null;
                    return (
                      <tr key={c.id} className={selectedIds.includes(c.id)?'is-selected':''}>
                        <td><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={()=>toggleSelect(c.id)} /></td>
                        <td>
                          <div style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:'var(--color-bg-subtle,#f8f9fc)' }}>
                            {c.cover_image_url
                              ? <img src={c.cover_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--color-text-hint)' }}>—</div>}
                          </div>
                        </td>
                        <td><a className="ad-title-link">{c.name}</a></td>
                        <td>
                          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {chair ? (
                              <div className="ad-author" style={{ gap:6 }}>
                                <MiniAvatar name={chair.name} />
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--color-text-hint)' }}>Chair</div>
                                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{chair.name}</div>
                                </div>
                              </div>
                            ) : <span className="ad-cell-muted" style={{ fontSize:12 }}>No chair assigned</span>}
                            {viceChair && (
                              <div className="ad-author" style={{ gap:6 }}>
                                <MiniAvatar name={viceChair} />
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--color-text-hint)' }}>Vice Chair</div>
                                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{viceChair}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td><span className="ad-pill-stat">{memberCount(c)} {memberCount(c)===1?'member':'members'}</span></td>
                        <td className="ad-actions">
                          {tab === 'active' && <>
                            <button className="ad-icon-btn" title="Edit details" onClick={() => setEditTarget(c)}><I.edit width="14" height="14" /></button>
                            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(c.id)}><I.archive width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleMoveToBin(c.id)}><I.trash width="14" height="14" /></button>
                          </>}
                          {tab === 'archived' && <>
                            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(c.id)}><I.restore width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleMoveToBin(c.id)}><I.trash width="14" height="14" /></button>
                          </>}
                          {tab === 'bin' && <>
                            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestoreFromBin(c.id)}><I.restore width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete Permanently" onClick={() => handleDelete(c.id)}><I.trash width="14" height="14" /></button>
                          </>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <TableFoot shown={`1–${filtered.length}`} total={filtered.length} label="committees" />
            </section>
          )}
        </main>
      </div>

      {addOpen && (
        <AddCommitteeModal
          onClose={() => setAddOpen(false)}
          onAdded={c => { setData(p => [c, ...p]); setAddOpen(false); }}
        />
      )}

      {editTarget && (
        <EditDetailsModal
          committee={editTarget}
          officerSuggestions={committeeSuggestions(editTarget)}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setData(p => p.map(c => c.id === editTarget!.id ? { ...c, ...updated } : c)); setEditTarget(null); }}
        />
      )}
    </>
  );
};

export default CommitteesPanel;
