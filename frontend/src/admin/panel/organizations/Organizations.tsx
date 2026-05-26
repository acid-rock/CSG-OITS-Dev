import { useState, useEffect, useCallback } from 'react';
import '../_shared/admin-list.css';
import axios from 'axios';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { I } from '../_shared/icons';
import { gradientFor } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface OrgEntry {
  id: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  logo_url: string | null;
  facebook_link: string | null;
  created_at?: string;
  deleted_at?: string;
  org_type?: 'academic' | 'non-academic' | 'spu' | 'rotc' | null;
  parent_id?: string | null;
}

type OrgTab = 'active' | 'archived' | 'bin';

const OrganizationsPanel = () => {
  const [orgTab, setOrgTab] = useState<OrgTab>('active');
  const [data, setData] = useState<OrgEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [orgType, setOrgType] = useState<OrgEntry['org_type']>(null);
  const [parentId, setParentId] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useLockBodyScroll(formOpen || confirmOpen);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const ep = orgTab === 'archived' ? `${API_URL}/organizations/archived`
        : orgTab === 'bin' ? `${API_URL}/organizations/bin`
        : `${API_URL}/organizations`;
      const { data: res } = await axios.get<OrgEntry[]>(ep, { withCredentials: true });
      setData(res);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : 'Failed to load organizations.'); }
    finally { setLoading(false); }
  }, [orgTab]);

  useEffect(() => { fetchData(); setSelected([]); }, [fetchData]);

  const openAdd = () => { setEditingId(null); setName(''); setDescription(''); setFacebookLink(''); setOrgType(null); setParentId(''); setLogoFile(null); setLogoPreview(null); setSubmitError(null); setFormOpen(true); };
  const openEdit = (org: OrgEntry) => { setEditingId(org.id); setName(org.name); setDescription(org.description ?? ''); setFacebookLink(org.facebook_link ?? ''); setOrgType(org.org_type ?? null); setParentId(org.parent_id ?? ''); setLogoFile(null); setLogoPreview(org.logo_url ?? null); setSubmitError(null); setFormOpen(true); };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); const r = new FileReader(); r.onloadend = () => setLogoPreview(r.result as string); r.readAsDataURL(file); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSubmitError('Name is required.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('name', name.trim()); fd.append('description', description); fd.append('facebook_link', facebookLink);
      if (orgType) fd.append('org_type', orgType);
      if (parentId) fd.append('parent_id', parentId);
      if (editingId) fd.append('id', editingId);
      if (logoFile) fd.append('logo', logoFile);
      const ep = editingId ? `${API_URL}/organizations/edit` : `${API_URL}/organizations/add`;
      const { data: result } = await axios.post<OrgEntry>(ep, fd, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
      if (editingId) setData(p => p.map(o => o.id === editingId ? { ...o, name: name.trim(), description, facebook_link: facebookLink, logo_url: logoPreview } : o));
      else setData(p => [...p, result]);
      setFormOpen(false);
    } catch (err: unknown) {
      const ed = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setSubmitError(ed?.error ?? ed?.message ?? 'Failed to save.');
    } finally { setSubmitting(false); }
  };

  const handleArchive = async (id: string) => {
    try { await axios.post(`${API_URL}/organizations/archive`, { id }, { withCredentials: true }); setData(p => p.filter(o => o.id !== id)); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Archive failed.'); }
  };
  const handleRestore = async (id: string) => {
    try { await axios.post(`${API_URL}/organizations/restore`, { id }, { withCredentials: true }); setData(p => p.filter(o => o.id !== id)); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Restore failed.'); }
  };
  const handleBin = async (id: string) => {
    try { await axios.post(`${API_URL}/organizations/bin`, { id }, { withCredentials: true }); setData(p => p.filter(o => o.id !== id)); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Move to bin failed.'); }
  };
  const handleRFB = async (id: string) => {
    try { await axios.post(`${API_URL}/organizations/restore-from-bin`, { id }, { withCredentials: true }); setData(p => p.filter(o => o.id !== id)); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Restore from bin failed.'); }
  };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try { await axios.delete(`${API_URL}/organizations/delete`, { data: { id: deleteId }, withCredentials: true }); setData(p => p.filter(o => o.id !== deleteId)); }
    catch { /* ignore */ } finally { setConfirmOpen(false); setDeleteId(null); }
  };

  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const bulkArchive = async () => {
    if (!selected.length) return;
    try { await Promise.all(selected.map(id => axios.post(`${API_URL}/organizations/archive`, { id }, { withCredentials: true }))); setData(p => p.filter(o => !selected.includes(o.id))); setSelected([]); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Bulk archive failed.'); }
  };
  const bulkBin = async () => {
    if (!selected.length) return;
    try { await Promise.all(selected.map(id => axios.post(`${API_URL}/organizations/bin`, { id }, { withCredentials: true }))); setData(p => p.filter(o => !selected.includes(o.id))); setSelected([]); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Bulk bin failed.'); }
  };
  const bulkRestore = async () => {
    if (!selected.length) return;
    try { await Promise.all(selected.map(id => axios.post(`${API_URL}/organizations/restore`, { id }, { withCredentials: true }))); setData(p => p.filter(o => !selected.includes(o.id))); setSelected([]); }
    catch (err: unknown) { const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data; setFetchError(d?.error ?? d?.message ?? 'Bulk restore failed.'); }
  };

  const getInitials = (n: string) => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const filtered = data.filter(o =>
    (!searchQuery || o.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!typeFilter || o.org_type === typeFilter)
  );

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="organizations" />
        <main className="ad-main">
          <PageHead
            title="Organizations"
            subtitle="Register and manage recognized student organizations."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {orgTab === 'active' && <button className="ad-btn-primary" onClick={openAdd}><I.plus width="14" height="14" />New organization</button>}
            </>}
          />
          <Tabs items={[
            { label: 'Active',   active: orgTab === 'active',   count: orgTab === 'active'   ? data.length : undefined },
            { label: 'Archived', active: orgTab === 'archived', count: orgTab === 'archived' ? data.length : undefined },
            { label: 'Bin',      active: orgTab === 'bin',      count: orgTab === 'bin'      ? data.length : undefined },
          ]} onTabChange={(l) => setOrgTab(l.toLowerCase() as OrgTab)} />
          <Toolbar placeholder="Search organizations…" search={searchQuery} onSearch={setSearchQuery} showSort={false} onRefresh={fetchData}>
            <span className="ad-filter-label">Type</span>
            <select className="ad-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="academic">Academic</option>
              <option value="non-academic">Non-Academic</option>
              <option value="spu">Student Publication Unit</option>
            </select>
          </Toolbar>
          {fetchError && <p style={{ fontSize: 13, color: 'var(--color-danger-text)' }}>{fetchError}</p>}
          {orgTab === 'active' && <BulkBar count={selected.length} actions={['Archive', 'Delete']} handlers={{ Archive: bulkArchive, Delete: bulkBin }} onClear={() => setSelected([])} />}
          {orgTab === 'archived' && <BulkBar count={selected.length} actions={['Restore', 'Delete']} handlers={{ Restore: bulkRestore, Delete: bulkBin }} onClear={() => setSelected([])} />}
          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{ width: 44 }} /><col style={{ width: 60 }} /><col /><col style={{ width: 160 }} /></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filtered.length > 0 && filtered.every(o => selected.includes(o.id))} onChange={() => setSelected(filtered.every(o => selected.includes(o.id)) ? [] : filtered.map(o => o.id))} /></th>
                  <th>Logo</th><th>Name &amp; description</th><th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={4}><div className="ad-empty"><p>{orgTab === 'bin' ? 'Bin is empty.' : 'No organizations found.'}</p></div></td></tr>}
                  {filtered.map(org => {
                    const [a, b] = gradientFor(org.name);
                    return (
                      <tr key={org.id} className={selected.includes(org.id) ? 'is-selected' : ''}>
                        <td><input type="checkbox" checked={selected.includes(org.id)} onChange={() => toggleSelect(org.id)} /></td>
                        <td>
                          <span className="ad-org-logo" style={org.logo_url ? undefined : { background: `linear-gradient(135deg, ${a}, ${b})` }}>
                            {org.logo_url ? <img src={org.logo_url} alt={org.name} /> : getInitials(org.name)}
                          </span>
                        </td>
                        <td>
                          <div className="ad-title-stack">
                            <a className="ad-title-link" href={org.facebook_link ?? '#'} target={org.facebook_link ? '_blank' : undefined} rel="noopener noreferrer">{org.name}</a>
                            {org.parent_id && (
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(79,111,209,0.08)', border: '1px solid rgba(79,111,209,0.18)', borderRadius: 4, padding: '1px 6px' }}>
                                Sub-org · {data.find(o => o.id === org.parent_id)?.name ?? 'Parent'}
                              </span>
                            )}
                            {org.description && <p className="ad-desc">{org.description}</p>}
                            {org.facebook_link && <div className="ad-meta"><span><I.link width="11" height="11" /> Facebook</span></div>}
                          </div>
                        </td>
                        <td className="ad-actions">
                          {orgTab === 'active' && <>
                            <button className="ad-icon-btn" title="Edit" onClick={() => openEdit(org)}><I.edit width="14" height="14" /></button>
                            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(org.id)}><I.archive width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to bin" onClick={() => handleBin(org.id)}><I.trash width="14" height="14" /></button>
                          </>}
                          {orgTab === 'archived' && <>
                            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(org.id)}><I.restore width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleBin(org.id)}><I.trash width="14" height="14" /></button>
                          </>}
                          {orgTab === 'bin' && <>
                            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRFB(org.id)}><I.restore width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete permanently" onClick={() => { setDeleteId(org.id); setDeleteName(org.name); setConfirmOpen(true); }}><I.trash width="14" height="14" /></button>
                          </>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <TableFoot shown={`1–${filtered.length}`} total={filtered.length} label="organizations" />
            </section>
          )}
        </main>
      </div>

      {formOpen && (
        <div className="ad-modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="ad-form-card ad-form-card--md" onClick={e => e.stopPropagation()}>
            <div className="ad-form-header">
              <span className="ad-form-header-title">{editingId ? 'Edit Organization' : 'New Organization'}</span>
              <button className="ad-form-close" onClick={() => setFormOpen(false)}><I.x width="14" height="14" /></button>
            </div>
            <form onSubmit={handleSubmit} className="ad-form-body">
              <label className="ad-field">Name *<input value={name} onChange={e => setName(e.target.value)} required /></label>
              <label className="ad-field">Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></label>
              <label className="ad-field">Facebook link<input value={facebookLink} onChange={e => setFacebookLink(e.target.value)} type="url" /></label>
              <label className="ad-field">
                Type
                <select value={orgType ?? ''} onChange={e => { setOrgType((e.target.value || null) as OrgEntry['org_type']); if (e.target.value !== 'academic') setParentId(''); }}>
                  <option value="">— None —</option>
                  <option value="academic">Academic</option>
                  <option value="non-academic">Non-Academic</option>
                  <option value="spu">Student Publication Unit</option>
                  <option value="rotc">ROTC</option>
                </select>
              </label>
              {/* Parent org picker — only relevant for academic sub-orgs */}
              {orgType === 'academic' && (
                <label className="ad-field">
                  Parent organization
                  <select value={parentId} onChange={e => setParentId(e.target.value)}>
                    <option value="">— None (top-level) —</option>
                    {data
                      .filter(o => o.org_type === 'academic' && o.id !== editingId && !o.parent_id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                    }
                  </select>
                  {parentId && <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>This org will appear under the selected parent and will not count toward the academic total.</p>}
                </label>
              )}
              <label className="ad-field">
                Logo
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: 13 }} />
                {logoPreview && <img src={logoPreview} alt="preview" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover' }} />}
              </label>
              {submitError && <p className="ad-field-error">{submitError}</p>}
              <div className="ad-form-actions">
                <button type="button" className="ad-btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="ad-btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="ad-modal-overlay" style={{ zIndex:1001 }} onClick={() => setConfirmOpen(false)}>
          <div className="ad-confirm-card" onClick={e => e.stopPropagation()}>
            <h3 className="ad-confirm-title">Delete "{deleteName}"?</h3>
            <p className="ad-confirm-msg">This action cannot be undone.</p>
            <div className="ad-confirm-actions">
              <button className="ad-btn-ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="ad-btn-primary" style={{ background:'var(--color-danger-text)', borderColor:'var(--color-danger-text)' }} onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrganizationsPanel;
