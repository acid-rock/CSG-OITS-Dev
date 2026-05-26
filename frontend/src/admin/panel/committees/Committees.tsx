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
  avatar?: string | null;
}

type Tab = 'active' | 'archived' | 'bin';

// ── Shared: Autocomplete officer field ──────────────────────────────────────
// Shows a filtered dropdown only while the user is typing.
// No chips, no pre-loaded list — clean and focused.

function OfficerField({ label, value, onChange, suggestions }: {
  label: string; value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="ad-field" ref={wrapRef} style={{ position: 'relative' }}>
      <label className="ad-field-label">{label}</label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (value.trim()) setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        placeholder="Type to search…"
        autoComplete="off"
        style={{ width: '100%' }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff',
          border: '1.5px solid var(--color-primary,#4f6fd1)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 8px 20px rgba(15,23,41,0.10)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map(s => (
            <button
              key={s} type="button"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', background: 'none',
                fontFamily: 'inherit', fontSize: 13.5, cursor: 'pointer',
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border-soft,#eef0f5)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface,#f4f6fd)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared: Member autocomplete input ───────────────────────────────────────
// Same filter-as-you-type pattern as OfficerField but works with officer objects
// (displays full_name, calls onSelect with the id).

function MemberAutocomplete({ available, onSelect }: {
  available: OfficerEntry[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length > 0
    ? available.filter(o => o.full_name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (available.length === 0) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        placeholder="Type to search and add a member…"
        autoComplete="off"
        style={{
          width: '100%', padding: '9px 12px',
          border: '1.5px solid var(--color-border,#e2e8f0)',
          borderRadius: open && filtered.length > 0 ? '10px 10px 0 0' : 10,
          fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
          transition: 'border-color 160ms',
        }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-primary,#4f6fd1)')}
        onBlurCapture={e => { if (!open) e.currentTarget.style.borderColor = 'var(--color-border,#e2e8f0)'; }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff',
          border: '1.5px solid var(--color-primary,#4f6fd1)',
          borderTop: 'none', borderRadius: '0 0 10px 10px',
          boxShadow: '0 8px 20px rgba(15,23,41,0.10)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map(o => (
            <button
              key={o.id} type="button"
              onMouseDown={e => {
                e.preventDefault();
                onSelect(o.id);
                setQuery('');
                setOpen(false);
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', background: 'none',
                fontFamily: 'inherit', fontSize: 13.5, cursor: 'pointer',
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border-soft,#eef0f5)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface,#f4f6fd)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {o.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared: MembersSection ───────────────────────────────────────────────────

function MembersSection({ allOfficers, committeeId, pendingAdd, pendingRemove, onAdd, onRemove }: {
  allOfficers: OfficerEntry[];
  committeeId: string | null;      // null for new committees
  pendingAdd: string[];
  pendingRemove: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const currentMembers = allOfficers.filter(o =>
    (committeeId && String(o.committee) === committeeId && !pendingRemove.includes(o.id)) ||
    pendingAdd.includes(o.id)
  );

  const available = allOfficers.filter(o =>
    !currentMembers.find(m => m.id === o.id) &&
    (o.committee == null || String(o.committee) !== committeeId)
  );

  return (
    <div className="ad-field">
      <label className="ad-field-label" style={{ marginBottom: 6 }}>
        Committee Members
        <span style={{ fontWeight: 400, color: 'var(--color-text-hint)', marginLeft: 6 }}>
          ({currentMembers.length})
        </span>
      </label>

      {/* Current member chips */}
      {currentMembers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {currentMembers.map(m => (
            <span key={m.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, padding: '4px 8px',
              background: 'rgba(79,111,209,0.08)', color: 'var(--color-primary-deep)',
              border: '1px solid var(--color-primary-light)', borderRadius: 999,
            }}>
              {m.full_name}
              <button type="button" onClick={() => onRemove(m.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, lineHeight: 1, color: 'inherit', opacity: 0.6,
                fontSize: 14,
              }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Add member — filter-as-you-type autocomplete */}
      <MemberAutocomplete available={available} onSelect={onAdd} />

      {available.length === 0 && currentMembers.length === 0 && (
        <p className="ad-field-hint">No officers available to add.</p>
      )}
    </div>
  );
}

// ── Edit Details Modal ────────────────────────────────────────────────────────

interface EditModalProps {
  committee: CommitteeEntry;
  allOfficers: OfficerEntry[];
  onClose: () => void;
  onSaved: (updated: Partial<CommitteeEntry>) => void;
  onRefresh: () => void;
}

function EditDetailsModal({ committee, allOfficers, onClose, onSaved, onRefresh }: EditModalProps) {
  const [name,         setName]       = useState(committee.name);
  const [chairName,    setChairName]  = useState(committee.chair_name ?? '');
  const [viceChair,    setViceChair]  = useState(committee.vice_chair_name ?? '');
  const [coverFile,    setCoverFile]  = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(committee.cover_image_url ?? null);
  const [pendingAdd,   setPendingAdd]   = useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggestions = allOfficers
    .filter(o => o.committee != null && String(o.committee) === committee.id)
    .map(o => o.full_name);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const r = new FileReader();
    r.onloadend = () => setCoverPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const handleAddMember = (officerId: string) => {
    setPendingAdd(p => [...p, officerId]);
    setPendingRemove(p => p.filter(id => id !== officerId));
  };
  const handleRemoveMember = (officerId: string) => {
    // If it was just added (pending), just undo the add
    if (pendingAdd.includes(officerId)) {
      setPendingAdd(p => p.filter(id => id !== officerId));
    } else {
      setPendingRemove(p => [...p, officerId]);
    }
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

      // Update members if any changes
      if (pendingAdd.length || pendingRemove.length) {
        await axios.post(`${API_URL}/committees/update-members`, {
          committee_id: committee.id,
          add:    pendingAdd,
          remove: pendingRemove,
        }, { withCredentials: true });
      }

      onSaved({ name: name.trim(), chair_name: chairName.trim()||null, vice_chair_name: viceChair.trim()||null, cover_image_url: newCoverUrl });
      if (pendingAdd.length || pendingRemove.length) onRefresh();
      onClose();
    } catch (err: unknown) {
      setError(apiErr(err, 'Save failed.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-form-card ad-form-card--md" onClick={e => e.stopPropagation()}>
        <div className="ad-form-header">
          <span className="ad-form-header-title">Edit Committee Details</span>
          <button className="ad-form-close" onClick={onClose}><I.x width="14" height="14" /></button>
        </div>

        <form onSubmit={handleSave} className="ad-form-body">
          {/* Cover photo — div not label to prevent double file dialog */}
          <div className="ad-field">
            <span className="ad-field-label">Cover Photo</span>
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
            {coverPreview && (
              <button
                type="button"
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                style={{ alignSelf: 'flex-start', marginTop: 6, fontSize: '0.75rem', color: 'var(--color-danger-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                × Remove photo
              </button>
            )}
          </div>

          {/* Committee name */}
          <label className="ad-field">
            Committee Name *
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Committee on Academic Affairs" />
          </label>

          {/* Chair — plain text with suggestion chips, no native datalist */}
          <OfficerField label="Chairperson" value={chairName} onChange={setChairName} suggestions={suggestions} />
          <OfficerField label="Vice Chairperson" value={viceChair} onChange={setViceChair} suggestions={suggestions} />

          {/* Members */}
          <MembersSection
            allOfficers={allOfficers}
            committeeId={committee.id}
            pendingAdd={pendingAdd}
            pendingRemove={pendingRemove}
            onAdd={handleAddMember}
            onRemove={handleRemoveMember}
          />

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

interface AddCommitteeModalProps {
  onClose: () => void;
  onAdded: (c: CommitteeEntry) => void;
  allOfficers: OfficerEntry[];
  onRefresh: () => void;
}

function AddCommitteeModal({ onClose, onAdded, allOfficers, onRefresh }: AddCommitteeModalProps) {
  const [name,         setName]       = useState('');
  const [chairName,    setChairName]  = useState('');
  const [viceChair,    setViceChair]  = useState('');
  const [coverFile,    setCoverFile]  = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingAdd,   setPendingAdd]   = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allNames = allOfficers.map(o => o.full_name);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const r = new FileReader();
    r.onloadend = () => setCoverPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Committee name is required.'); return; }
    setAdding(true); setError(null);
    try {
      const { data: created } = await axios.post<CommitteeEntry>(
        `${API_URL}/committees/add`, { name: name.trim() }, { withCredentials: true }
      );

      let newCoverUrl = null;
      if (coverFile) {
        const fd = new FormData();
        fd.append('id', created.id);
        fd.append('cover', coverFile);
        const { data: cv } = await axios.post<{ cover_image_url: string }>(
          `${API_URL}/committees/upload-cover`, fd,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        );
        newCoverUrl = cv.cover_image_url;
      }

      if (chairName.trim() || viceChair.trim()) {
        await axios.post(`${API_URL}/committees/edit`, {
          id: created.id, name: name.trim(),
          chair_name: chairName.trim() || null,
          vice_chair_name: viceChair.trim() || null,
        }, { withCredentials: true });
      }

      if (pendingAdd.length) {
        await axios.post(`${API_URL}/committees/update-members`, {
          committee_id: created.id, add: pendingAdd, remove: [],
        }, { withCredentials: true });
        onRefresh();
      }

      onAdded({ ...created, cover_image_url: newCoverUrl, chair_name: chairName.trim()||null, vice_chair_name: viceChair.trim()||null });
      onClose();
    } catch (err: unknown) { setError(apiErr(err, 'Failed to add.')); }
    finally { setAdding(false); }
  };

  // For a new committee there's no existing ID — use null
  const fakeMembersForPending = allOfficers.filter(o => pendingAdd.includes(o.id));

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-form-card ad-form-card--md" onClick={e => e.stopPropagation()}>
        <div className="ad-form-header">
          <span className="ad-form-header-title">New Committee</span>
          <button className="ad-form-close" onClick={onClose}><I.x width="14" height="14" /></button>
        </div>
        <form onSubmit={handleAdd} className="ad-form-body">
          {/* Cover photo — div not label to prevent double file dialog */}
          <div className="ad-field">
            <span className="ad-field-label">Cover Photo</span>
            <div className="ad-upload-zone" onClick={() => fileRef.current?.click()}>
              {coverPreview && <img src={coverPreview} alt="cover" className="ad-upload-preview" />}
              {!coverPreview && (
                <div className="ad-upload-zone-label">
                  <I.upload width="22" height="22" />
                  <span>Click to upload a cover photo (optional)</span>
                </div>
              )}
              <span className="ad-upload-badge">{coverPreview ? 'Click to replace' : 'PNG, JPG'}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleCoverChange} />
            {coverPreview && (
              <button
                type="button"
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                style={{ alignSelf: 'flex-start', marginTop: 6, fontSize: '0.75rem', color: 'var(--color-danger-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                × Remove photo
              </button>
            )}
          </div>

          <label className="ad-field">
            Committee Name *
            <input autoFocus value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Committee on Academic Affairs" />
          </label>

          <OfficerField label="Chairperson" value={chairName} onChange={setChairName} suggestions={allNames} />
          <OfficerField label="Vice Chairperson" value={viceChair} onChange={setViceChair} suggestions={allNames} />

          {/* Members for new committee */}
          <div className="ad-field">
            <label className="ad-field-label" style={{ marginBottom: 6 }}>
              Committee Members
              <span style={{ fontWeight: 400, color: 'var(--color-text-hint)', marginLeft: 6 }}>({pendingAdd.length})</span>
            </label>
            {fakeMembersForPending.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {fakeMembersForPending.map(m => (
                  <span key={m.id} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, padding:'4px 8px', background:'rgba(79,111,209,0.08)', color:'var(--color-primary-deep)', border:'1px solid var(--color-primary-light)', borderRadius:999 }}>
                    {m.full_name}
                    <button type="button" onClick={() => setPendingAdd(p => p.filter(id => id !== m.id))} style={{ background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1, color:'inherit', opacity:0.6, fontSize:14 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <MemberAutocomplete
              available={allOfficers.filter(o => !pendingAdd.includes(o.id))}
              onSelect={id => setPendingAdd(p => [...p, id])}
            />
          </div>

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
  const [_spinning, setSpinning] = useState(false);
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
    if (c.chair_name) {
      const matched = officers.find(o => o.full_name === c.chair_name);
      return { name: c.chair_name, avatar: matched?.avatar ?? null };
    }
    const chair = officers.find(o => o.committee != null && String(o.committee) === c.id && o.is_committee_official);
    return chair ? { name: chair.full_name, avatar: chair.avatar ?? null } : null;
  };

  const resolveViceChair = (c: CommitteeEntry): { name: string; avatar?: string | null } | null => {
    if (!c.vice_chair_name?.trim()) return null;
    const matched = officers.find(o => o.full_name === c.vice_chair_name);
    return { name: c.vice_chair_name, avatar: matched?.avatar ?? null };
  };

  const memberCount = (c: CommitteeEntry): number =>
    officers.filter(o => o.committee != null && String(o.committee) === c.id).length;


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
                    const chair    = resolveChair(c);
                    const viceChar = resolveViceChair(c);
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
                                {chair.avatar
                                  ? <img src={chair.avatar} alt={chair.name} style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                                  : <MiniAvatar name={chair.name} />}
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--color-text-hint)' }}>Chair</div>
                                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{chair.name}</div>
                                </div>
                              </div>
                            ) : <span className="ad-cell-muted" style={{ fontSize:12 }}>No chair assigned</span>}
                            {viceChar && (
                              <div className="ad-author" style={{ gap:6 }}>
                                {viceChar.avatar
                                  ? <img src={viceChar.avatar} alt={viceChar.name} style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                                  : <MiniAvatar name={viceChar.name} />}
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', color:'var(--color-text-hint)' }}>Vice Chair</div>
                                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160 }}>{viceChar.name}</div>
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
          allOfficers={officers}
          onRefresh={fetchData}
        />
      )}

      {editTarget && (
        <EditDetailsModal
          committee={editTarget}
          allOfficers={officers}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setData(p => p.map(c => c.id === editTarget!.id ? { ...c, ...updated } : c)); setEditTarget(null); }}
          onRefresh={fetchData}
        />
      )}
    </>
  );
};

export default CommitteesPanel;
