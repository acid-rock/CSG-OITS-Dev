import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../_shared/admin-list.css';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import PublicPreviewModal from '../../components/modals/PublicPreviewModal/PublicPreviewModal';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { Thumb, Tag } from '../_shared/atoms';
import { I } from '../_shared/icons';
import { timeAgo, fmtDate, formatTypeLabel } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface DocumentEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  url: string;
  thumbnail: string;
  term?: string;
  deleted_at?: string;
  archived_at?: string;
  owner_id?: string;
}

type Tab = 'active' | 'archived' | 'bin';

type Tone = 'primary'|'warning'|'danger'|'neutral'|'success';
const DOC_TONE: Record<string, Tone> = {
  'Activity Proposal': 'primary', 'Memo': 'primary',
  'Minutes': 'neutral', 'Resolution': 'danger', 'Excuse Letter': 'warning',
};

const groupByTerm = (items: DocumentEntry[]): Record<string, DocumentEntry[]> => {
  const groups: Record<string, DocumentEntry[]> = {};
  items.forEach(item => {
    const year = item.deleted_at
      ? new Date(item.deleted_at).getFullYear()
      : item.archived_at ? new Date(item.archived_at).getFullYear() : new Date().getFullYear();
    const term = `${year}–${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Documents = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [open, setOpen] = useState(() => searchParams.get('action') === 'upload');
  const [id, setId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<DocumentEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null); setActive([]);
    try {
      const ep = tab === 'archived' ? `${API_URL}/documents/archived?t=${Date.now()}`
        : tab === 'bin' ? `${API_URL}/documents/bin?t=${Date.now()}`
        : `${API_URL}/documents`;
      const { data: r } = await axios.get<DocumentEntry[]>(ep, { withCredentials: true });
      setData(Array.isArray(r) ? r : (r as { data?: DocumentEntry[] }).data ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  const handleActive = (id: string) =>
    setActive(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };

  const handleArchive = async (id: string) => {
    try { await axios.post(`${API_URL}/documents/archive`, { ids: [id] }, { withCredentials: true }); setData(p => p.filter(d => d.id !== id)); }
    catch (err: unknown) { setFetchError('Archive failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleMoveToBin = async (id: string) => {
    try { await axios.post(`${API_URL}/documents/bin`, { ids: [id] }, { withCredentials: true }); setData(p => p.filter(d => d.id !== id)); }
    catch (err: unknown) { setFetchError('Move to bin failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleRestore = async (id: string) => {
    try { await axios.post(`${API_URL}/documents/restore`, { ids: [id] }, { withCredentials: true }); setData(p => p.filter(d => d.id !== id)); }
    catch (err: unknown) { setFetchError('Restore failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleRestoreFromBin = async (id: string) => {
    try { await axios.post(`${API_URL}/documents/restore-from-bin`, { ids: [id] }, { withCredentials: true }); setData(p => p.filter(d => d.id !== id)); }
    catch { fetchData(); }
  };
  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete?')) return;
    try { await axios.delete(`${API_URL}/documents/delete`, { data: { ids: [id] }, withCredentials: true }); setData(p => p.filter(d => d.id !== id)); }
    catch (err: unknown) { setFetchError('Delete failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };

  const bulkArchive = async () => { if (!active.length) return; await axios.post(`${API_URL}/documents/archive`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkBin    = async () => { if (!active.length) return; await axios.post(`${API_URL}/documents/bin`,     { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkRestore = async () => { if (!active.length) return; await axios.post(`${API_URL}/documents/restore`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkRestoreFromBin = async () => { if (!active.length) return; await axios.post(`${API_URL}/documents/restore-from-bin`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkDelete  = async () => {
    if (!active.length || !window.confirm(`Delete ${active.length} items?`)) return;
    await axios.delete(`${API_URL}/documents/bin/purge`, { data: active, withCredentials: true }); fetchData(); setActive([]);
  };

  const toggleTerm = (t: string) => setOpenTerms(p => ({ ...p, [t]: !p[t] }));
  const rawFmt = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isTermOpen = (t: string) => openTerms[t] !== undefined ? openTerms[t] : t === sortedTerms[0];

  const filteredData = data
    .filter(d => !filter || rawFmt(d.category) === filter)
    .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
      if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
      if (sort === 'Date (Newest)') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'Date (Oldest)') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });

  const docTypes = [...new Set(data.map(d => d.category).filter(Boolean))].sort().map(rawFmt);


  const DocRow = ({ d }: { d: DocumentEntry }) => {
    const label = rawFmt(d.category);
    const tone: Tone = DOC_TONE[label] ?? 'neutral';
    return (
      <tr key={d.id} className={active.includes(d.id) ? 'is-selected' : ''}>
        <td><input type="checkbox" checked={active.includes(d.id)} onChange={() => handleActive(d.id)} /></td>
        <td><Thumb src={d.thumbnail || null} title={d.category} kind="doc" /></td>
        <td>
          <div className="ad-title-stack">
            <div className="ad-title-row">
              <Tag label={label} tone={tone} />
              <a className="ad-title-link ad-mono" href={d.url} target="_blank" rel="noopener noreferrer" title={d.name}>{d.name}</a>
            </div>
            {d.description && <p className="ad-desc">{d.description}</p>}
            <div className="ad-meta">
              <span><I.doc width="11" height="11" /> PDF</span>
              {d.term && <span className="ad-mono">{d.term}</span>}
            </div>
          </div>
        </td>
        <td>
          <div className="ad-date">
            <span className="ad-date-abs">{fmtDate(d.createdAt)}</span>
            <span className="ad-date-rel">{d.createdAt ? timeAgo(d.createdAt) : '—'}</span>
          </div>
        </td>
        <td className="ad-actions">
          {tab === 'active' && <>
            <button className="ad-icon-btn" title="Preview (public view)" onClick={() => setPreviewItem(d)}><I.eye width="14" height="14" /></button>
            <a className="ad-icon-btn" href={d.url} target="_blank" rel="noopener noreferrer" download title="Download PDF"><I.download width="14" height="14" /></a>
            <button className="ad-icon-btn" title="Edit" onClick={() => { setId(d.id); setSelectedName(d.name); setEditTitle(d.name); setEditDescription(d.description); setEditType(d.category); setOpen(true); }}><I.edit width="14" height="14" /></button>
            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(d.id)}><I.archive width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to bin" onClick={() => handleMoveToBin(d.id)}><I.trash width="14" height="14" /></button>
          </>}
          {tab === 'archived' && <>
            <button className="ad-icon-btn is-on" title="Restore to Active" onClick={() => handleRestore(d.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to Bin" onClick={() => handleMoveToBin(d.id)}><I.trash width="14" height="14" /></button>
          </>}
          {tab === 'bin' && <>
            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestoreFromBin(d.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete permanently" onClick={() => handlePermanentDelete(d.id)}><I.trash width="14" height="14" /></button>
          </>}
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="documents" />
        <main className="ad-main">
          <PageHead
            title="Documents"
            subtitle="Upload resolutions, memos, minutes, proposals, and excuse letters."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {tab === 'active' && (
                <button className="ad-btn-primary" onClick={() => { setId(null); setSelectedName(null); setEditTitle(''); setEditDescription(''); setEditType(''); setOpen(true); }}>
                  <I.upload width="14" height="14" />Upload document
                </button>
              )}
            </>}
          />
          <Tabs
            items={[
              { label: 'Active',   active: tab === 'active',   count: tab === 'active' ? data.length : undefined },
              { label: 'Archived', active: tab === 'archived', count: tab === 'archived' ? data.length : undefined },
              { label: 'Bin',      active: tab === 'bin',      count: tab === 'bin' ? data.length : undefined },
            ]}
            onTabChange={(l) => setTab(l.toLowerCase() as Tab)}
          />
          <Toolbar
            placeholder="Search documents by file name, description, or term…"
            search={searchQuery}
            onSearch={setSearchQuery}
            onRefresh={handleRefresh}
            showSort={false}
          >
            <span className="ad-filter-label">Filter</span>
            <select
              className="ad-filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">Type: All</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="ad-filter-label">Sort</span>
            <select
              className="ad-filter-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="">Newest first</option>
              <option value="Date (Oldest)">Oldest first</option>
              <option value="Name (A-Z)">A → Z</option>
              <option value="Name (Z-A)">Z → A</option>
            </select>
          </Toolbar>

          {fetchError && <p style={{ fontSize: 13, color: 'var(--color-danger-text)' }}>{fetchError}</p>}

          {tab === 'active' && <BulkBar count={active.length} actions={['Archive', 'Delete']} handlers={{ Archive: bulkArchive, Delete: bulkBin }} onClear={() => setActive([])} />}
          {tab === 'archived' && <BulkBar count={active.length} actions={['Restore', 'Delete']} handlers={{ Restore: bulkRestore, Delete: bulkDelete }} onClear={() => setActive([])} />}
          {tab === 'bin' && <BulkBar count={active.length} actions={['Restore', 'Delete']} handlers={{ Restore: bulkRestoreFromBin, Delete: bulkDelete }} onClear={() => setActive([])} />}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : tab === 'archived' ? (
            <>
              {sortedTerms.length === 0 && <section className="ad-card"><div className="ad-empty"><p>No archived documents.</p></div></section>}
              {sortedTerms.map(term => (
                <div key={term}>
                  <button style={{ display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,color:'var(--color-text-primary)',padding:'8px 0' }} onClick={() => toggleTerm(term)}>
                    <I.chev width="14" height="14" style={{ transform: isTermOpen(term) ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
                    {term} <span style={{ fontWeight:500,color:'var(--color-text-muted)',fontSize:12 }}>({archivedGroups[term].length})</span>
                  </button>
                  {isTermOpen(term) && (
                    <section className="ad-card" style={{ marginBottom: 8 }}>
                      <table className="ad-table">
                        <thead><tr>
                          <th><input type="checkbox" checked={archivedGroups[term].every(d => active.includes(d.id))} onChange={() => { const ids = archivedGroups[term].map(d => d.id); setActive(p => ids.every(id => p.includes(id)) ? p.filter(id => !ids.includes(id)) : [...new Set([...p,...ids])]); }} /></th>
                          <th>Thumb</th><th>File &amp; description</th><th>Archived</th><th className="ad-th-right">Actions</th>
                        </tr></thead>
                        <tbody>{archivedGroups[term].map(d => <DocRow key={d.id} d={d} />)}</tbody>
                      </table>
                    </section>
                  )}
                </div>
              ))}
            </>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{width:44}}/><col style={{width:72}}/><col/><col style={{width:140}}/><col style={{width:160}}/></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filteredData.length > 0 && filteredData.every(d => active.includes(d.id))} onChange={() => setActive(filteredData.every(d => active.includes(d.id)) ? [] : filteredData.map(d => d.id))} /></th>
                  <th>Thumb</th><th>File &amp; description</th><th>Uploaded</th><th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredData.length === 0 && <tr><td colSpan={5}><div className="ad-empty"><p>{tab === 'bin' ? 'Bin is empty.' : 'No documents found.'}</p></div></td></tr>}
                  {filteredData.map(d => <DocRow key={d.id} d={d} />)}
                </tbody>
              </table>
              <TableFoot shown={`1–${filteredData.length}`} total={filteredData.length} label="documents" />
            </section>
          )}
        </main>
      </div>

      {open && (
        <div className="ad-modal-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <Form
              forType="document"
              id={id}
              initialTitle={editTitle}
              initialDescription={editDescription}
              initialType={editType}
              setOpen={setOpen}
              onSuccess={() => { setOpen(false); fetchData(); }}
            />
          </div>
        </div>
      )}
      {isModalOpen && <DeleteModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchData(); }} />}
      {previewItem && (
        <PublicPreviewModal
          isOpen={true}
          type="document"
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
};

export default Documents;
