import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const API_URL = import.meta.env.VITE_API_URL as string;

interface OrgEntry {
  id: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  logo_url: string | null;
  facebook_link: string | null;
}

type OrgTab = 'active' | 'archived' | 'bin';

const OrganizationsPanel = () => {
  const [orgTab, setOrgTab] = useState<OrgTab>('active');
  const [data, setData] = useState<OrgEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useLockBodyScroll(formOpen || confirmOpen);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const endpoint = orgTab === 'archived'
        ? `${API_URL}/organizations/archived`
        : orgTab === 'bin'
        ? `${API_URL}/organizations/bin`
        : `${API_URL}/organizations`;
      const { data: res } = await axios.get<OrgEntry[]>(endpoint, { withCredentials: true });
      setData(res);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }, [orgTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditingId(null); setName(''); setDescription(''); setFacebookLink('');
    setLogoFile(null); setLogoPreview(null); setSubmitError(null);
    setFormOpen(true);
  };

  const openEdit = (org: OrgEntry) => {
    setEditingId(org.id); setName(org.name); setDescription(org.description ?? '');
    setFacebookLink(org.facebook_link ?? ''); setLogoFile(null);
    setLogoPreview(org.logo_url ?? null); setSubmitError(null);
    setFormOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSubmitError('Name is required.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description);
      fd.append('facebook_link', facebookLink);
      if (editingId) fd.append('id', editingId);
      if (logoFile) fd.append('logo', logoFile);

      const endpoint = editingId ? `${API_URL}/organizations/edit` : `${API_URL}/organizations/add`;
      const { data: result } = await axios.post<OrgEntry>(endpoint, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (editingId) {
        setData((prev) => prev.map((o) => o.id === editingId ? { ...o, name: name.trim(), description, facebook_link: facebookLink, logo_url: logoPreview } : o));
      } else {
        setData((prev) => [...prev, result]);
      }
      setFormOpen(false);
    } catch (err: unknown) {
      setSubmitError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save organization.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_URL}/organizations/delete`, { data: { id: deleteId }, withCredentials: true });
      setData((prev) => prev.filter((o) => o.id !== deleteId));
    } catch {
      // silently ignore
    } finally {
      setConfirmOpen(false); setDeleteId(null);
    }
  };

  const getInitials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const tabStyle = (t: OrgTab) => ({
    padding: '0.35rem 1rem', border: 'none',
    borderBottom: orgTab === t ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'none', cursor: 'pointer',
    fontWeight: orgTab === t ? 600 : 400,
    color: orgTab === t ? '#3b82f6' : '#6b7280', fontSize: '0.9rem',
  });

  return (
    <div className='announce-container'>
      <div className='announce-header'><span>Organizations</span></div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.5rem' }}>
        <button style={tabStyle('active')} onClick={() => setOrgTab('active')}>Active</button>
        <button style={tabStyle('archived')} onClick={() => setOrgTab('archived')}>Archived</button>
        <button style={tabStyle('bin')} onClick={() => setOrgTab('bin')}>Bin</button>
      </div>

      {fetchError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{fetchError}</p>}

      <div className='announce-toolbar'>
        <span className='announce-file-count'>{data.length} Organizations</span>
        <div className='announce-toolbar-actions'>
          {orgTab === 'active' && <button className='announce-add-btn' onClick={openAdd}>Add Organization</button>}
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '1rem' }}>Loading...</p>
      ) : (
        <div className='announce-file-table'>
          <table>
            <thead>
              <tr className='announce-table-header-light'>
                <th style={{ width: 60 }}>Logo</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((org) => (
                <tr
                  key={org.id}
                  className='announce-table-row'
                  onMouseEnter={() => setHoveredRowId(org.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <td>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' }}>
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : getInitials(org.name)}
                    </div>
                  </td>
                  <td>{org.name}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.description ?? '—'}</td>
                  <td className='announce-file-btn'>
                    {hoveredRowId === org.id && (
                      <div className='announce-file-btn-inner'>
                        <button title='Edit' onClick={() => openEdit(org)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Edit</button>
                        <button title='Delete' onClick={() => { setDeleteId(org.id); setDeleteName(org.name); setConfirmOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '1rem', color: '#9ca3af', textAlign: 'center' }}>No organizations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 480, width: '92%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>{editingId ? 'Edit Organization' : 'Add Organization'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder='Organization name' style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder='Short description' style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Facebook Link</label>
                <input value={facebookLink} onChange={(e) => setFacebookLink(e.target.value)} placeholder='https://facebook.com/...' style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Logo</label>
                {logoPreview && <img src={logoPreview} alt='preview' style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' }} />}
                <input type='file' accept='image/*' onChange={handleLogoChange} style={{ fontSize: '0.85rem' }} />
              </div>
              {submitError && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{submitError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type='button' onClick={() => setFormOpen(false)} style={{ padding: '0.5rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type='submit' disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 400, width: '92%' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Delete Organization</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Delete <strong>{deleteName}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ padding: '0.6rem 1.5rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} style={{ padding: '0.6rem 1.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPanel;
