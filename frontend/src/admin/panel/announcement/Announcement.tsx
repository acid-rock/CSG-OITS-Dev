import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../_shared/admin-list.css';
import Form from '../../components/form/Form';
import DeleteModal from '../../components/modals/deleteModal/DeleteModal';
import PublicPreviewModal from '../../components/modals/PublicPreviewModal/PublicPreviewModal';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { Thumb, Tag, MiniAvatar } from '../_shared/atoms';
import { I } from '../_shared/icons';
import { timeAgo, fmtDate, stripHtml, shortId } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface BulletinEntry {
  id: string;
  imgUrl: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  archived_at?: string;
  category?: string;
  owner_id?: string;
}

type Tab = 'active' | 'archived' | 'bin';

const CAT_TONE: Record<string, string> = {
  'CSG Updates':      'primary',
  'Official CVSU':    'primary',
  'Class Advisories': 'warning',
  'Examinations':     'warning',
  'University Events':'neutral',
};

const groupByTerm = (items: BulletinEntry[]): Record<string, BulletinEntry[]> => {
  const groups: Record<string, BulletinEntry[]> = {};
  items.forEach(item => {
    const year = item.archived_at ? new Date(item.archived_at).getFullYear() : new Date().getFullYear();
    const term = `${year}–${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Announcement = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<BulletinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [open, setOpen] = useState(() => searchParams.get('action') === 'new');
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('');
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<BulletinEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setActive([]);
    try {
      const endpoint = tab === 'archived'
        ? `${API_URL}/announcements/archived`
        : tab === 'bin'
        ? `${API_URL}/announcements/bin`
        : `${API_URL}/announcements/`;
      const { data: responseData } = await axios.get(endpoint, { withCredentials: true });
      setData(responseData);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  const handleActive = (entryId: string) =>
    setActive((prev) => prev.includes(entryId) ? prev.filter(i => i !== entryId) : [...prev, entryId]);

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const handlePin = async (entryId: string) => {
    const entry = data.find(e => e.id === entryId);
    const alreadyPinned = entry?.is_pinned ?? false;
    try {
      if (alreadyPinned) {
        // Toggle off — unpin this item
        await axios.post(`${API_URL}/announcements/unpin`, { id: entryId }, { withCredentials: true });
        setData(prev => prev.map(e => e.id === entryId ? { ...e, is_pinned: false } : e));
      } else {
        // Pin this item (backend unpins all others first)
        await axios.post(`${API_URL}/announcements/pin`, { id: entryId }, { withCredentials: true });
        // Update state: mark new pin, clear old pin, then sort pinned to top
        setData(prev => {
          const updated = prev.map(e => ({ ...e, is_pinned: e.id === entryId }));
          return [...updated.filter(e => e.is_pinned), ...updated.filter(e => !e.is_pinned)];
        });
      }
    } catch { fetchData(); }
  };

  const handleArchive = async (entryId: string) => {
    try {
      await axios.post(`${API_URL}/announcements/archive`, { ids: [entryId] }, { withCredentials: true });
      setData(prev => prev.filter(a => a.id !== entryId));
    } catch (err: unknown) {
      setFetchError('Archive failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown'));
    }
  };

  const handleMoveToBin = async (entryId: string) => {
    try {
      await axios.post(`${API_URL}/announcements/bin`, { ids: [entryId] }, { withCredentials: true });
      setData(prev => prev.filter(item => item.id !== entryId));
    } catch { fetchData(); }
  };

  const handleRestore = async (entryId: string) => {
    try {
      await axios.post(`${API_URL}/announcements/restore`, { ids: [entryId] }, { withCredentials: true });
      setData(prev => prev.filter(a => a.id !== entryId));
    } catch (err: unknown) {
      setFetchError('Restore failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown'));
    }
  };

  const handleRestoreFromBin = async (entryId: string) => {
    try {
      await axios.post(`${API_URL}/announcements/restore-from-bin`, { ids: [entryId] }, { withCredentials: true });
      setData(prev => prev.filter(item => item.id !== entryId));
    } catch { fetchData(); }
  };

  const handlePermanentDelete = async (entryId: string) => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/announcements/delete`, { data: { ids: [entryId] }, withCredentials: true });
      setData(prev => prev.filter(item => item.id !== entryId));
    } catch (err: unknown) {
      setFetchError('Delete failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown'));
    }
  };

  const bulkArchive = async () => {
    if (!active.length) return;
    try { await axios.post(`${API_URL}/announcements/archive`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError('Bulk archive failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const bulkBin = async () => {
    if (!active.length) return;
    try { await axios.post(`${API_URL}/announcements/bin`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError('Bulk bin failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const bulkRestore = async () => {
    if (!active.length) return;
    try { await axios.post(`${API_URL}/announcements/restore`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError('Bulk restore failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const bulkRestoreFromBin = async () => {
    if (!active.length) return;
    try { await axios.post(`${API_URL}/announcements/restore-from-bin`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError('Bulk restore failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const bulkDelete = async () => {
    if (!active.length) return;
    if (!window.confirm(`Permanently delete ${active.length} items?`)) return;
    try { await axios.delete(`${API_URL}/announcements/delete`, { data: active.map(id => ({ id })), withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError('Bulk delete failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };

  const toggleTerm = (term: string) => setOpenTerms(prev => ({ ...prev, [term]: !prev[term] }));

  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isOpen = (term: string) => openTerms[term] !== undefined ? openTerms[term] : term === sortedTerms[0];

  const filteredData = data
    .filter(e => !filter || (e.category ?? 'CSG Updates') === filter)
    .filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(e.content ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.title.localeCompare(b.title);
      if (sort === 'Name (Z-A)') return b.title.localeCompare(a.title);
      if (sort === 'Date (Newest)') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'Date (Oldest)') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });

  const categories = ['CSG Updates', 'Class Advisories', 'Examinations', 'University Events', 'Official CVSU'];

  const dateField = (e: BulletinEntry) => e.created_at || e.date;


  return (
    <>
      <div className="ad-shell">
        <Sidebar active="announcement" />
        <main className="ad-main">
          <PageHead
            title="Announcements"
            subtitle="Post, pin, and manage public announcements. Active items appear on the public bulletin."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {tab === 'active' && (
                <button className="ad-btn-primary" onClick={() => { setId(null); setEditTitle(''); setEditDescription(''); setOpen(true); }}>
                  <I.plus width="14" height="14" />New announcement
                </button>
              )}
            </>}
          />

          <Tabs
            items={[
              { label: 'Active',   count: tab === 'active'   ? data.length : undefined, active: tab === 'active' },
              { label: 'Archived', count: tab === 'archived' ? data.length : undefined, active: tab === 'archived' },
              { label: 'Bin',      count: tab === 'bin'      ? data.length : undefined, active: tab === 'bin' },
            ]}
            onTabChange={(l) => setTab(l.toLowerCase() as Tab)}
          />

          <Toolbar
            placeholder="Search announcements by title or content…"
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
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
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

          {fetchError && <p style={{ fontSize: 13, color: 'var(--color-danger-text)', padding: '0 4px' }}>{fetchError}</p>}

          {tab === 'active' && (
            <BulkBar
              count={active.length}
              actions={['Archive', 'Delete']}
              handlers={{ Archive: bulkArchive, Delete: bulkBin }}
              onClear={() => setActive([])}
            />
          )}
          {tab === 'archived' && (
            <BulkBar count={active.length} actions={['Restore', 'Delete']} handlers={{ Restore: bulkRestore, Delete: bulkDelete }} onClear={() => setActive([])} />
          )}
          {tab === 'bin' && (
            <BulkBar count={active.length} actions={['Restore', 'Delete']} handlers={{ Restore: bulkRestoreFromBin, Delete: bulkDelete }} onClear={() => setActive([])} />
          )}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : tab === 'archived' ? (
            /* Grouped archived view */
            <>
              {sortedTerms.length === 0 && (
                <section className="ad-card"><div className="ad-empty"><p>No archived announcements.</p></div></section>
              )}
              {sortedTerms.map(term => (
                <div key={term}>
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)', padding: '8px 0' }}
                    onClick={() => toggleTerm(term)}
                  >
                    <I.chev width="14" height="14" style={{ transform: isOpen(term) ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
                    {term} <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', fontSize: 12 }}>({archivedGroups[term].length})</span>
                  </button>
                  {isOpen(term) && (
                    <section className="ad-card" style={{ marginBottom: 8 }}>
                      <table className="ad-table">
                        <thead><tr>
                          <th><input type="checkbox" checked={archivedGroups[term].every(e => active.includes(e.id))} onChange={() => {
                            const ids = archivedGroups[term].map(e => e.id);
                            setActive(prev => ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
                          }} /></th>
                          <th>Image</th><th>Title &amp; description</th><th>Archived</th>
                          <th className="ad-th-right">Actions</th>
                        </tr></thead>
                        <tbody>
                          {archivedGroups[term].map(entry => (
                            <tr key={entry.id} className={active.includes(entry.id) ? 'is-selected' : ''}>
                              <td><input type="checkbox" checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)} /></td>
                              <td><Thumb src={entry.imgUrl || null} title={entry.title} /></td>
                              <td>
                                <div className="ad-title-stack">
                                  <div className="ad-title-row">
                                    <Tag label={entry.category ?? 'CSG Updates'} tone={(CAT_TONE[entry.category ?? ''] ?? 'neutral') as 'primary'|'warning'|'danger'|'neutral'|'success'} />
                                    <span className="ad-title-link">{entry.title}</span>
                                  </div>
                                  <p className="ad-desc">{stripHtml(entry.content ?? '')}</p>
                                </div>
                              </td>
                              <td>
                                <div className="ad-date">
                                  <span className="ad-date-abs">{fmtDate(entry.archived_at)}</span>
                                  <span className="ad-date-rel">{entry.archived_at ? timeAgo(entry.archived_at) : '—'}</span>
                                </div>
                              </td>
                              <td className="ad-actions">
                                <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(entry.id)}><I.restore width="14" height="14" /></button>
                                <button className="ad-icon-btn ad-icon-btn--danger" title="Delete permanently" onClick={() => handlePermanentDelete(entry.id)}><I.trash width="14" height="14" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  )}
                </div>
              ))}
            </>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup>
                  <col style={{ width: 44 }} /><col style={{ width: 72 }} /><col />
                  <col style={{ width: 140 }} /><col style={{ width: 160 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox"
                        checked={filteredData.length > 0 && filteredData.every(e => active.includes(e.id))}
                        onChange={() => setActive(filteredData.every(e => active.includes(e.id)) ? [] : filteredData.map(e => e.id))}
                      />
                    </th>
                    <th>Image</th>
                    <th>Title &amp; description</th>
                    {tab === 'active' && <th>Posted</th>}
                    {tab === 'bin' && <th>Deleted</th>}
                    <th className="ad-th-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 && (
                    <tr><td colSpan={5}>
                      <div className="ad-empty"><p>{tab === 'bin' ? 'Bin is empty.' : 'No announcements found.'}</p></div>
                    </td></tr>
                  )}
                  {filteredData.map(entry => (
                    <tr
                      key={entry.id}
                      className={`${active.includes(entry.id) ? 'is-selected ' : ''}${entry.is_pinned ? 'is-pinned' : ''}`}
                    >
                      <td><input type="checkbox" checked={active.includes(entry.id)} onChange={() => handleActive(entry.id)} /></td>
                      <td><Thumb src={entry.imgUrl || null} title={entry.title} /></td>
                      <td>
                        <div className="ad-title-stack">
                          <div className="ad-title-row">
                            {entry.is_pinned && <span className="ad-pin-flag" title="Pinned"><I.pin width="11" height="11" /></span>}
                            <Tag label={entry.category ?? 'CSG Updates'} tone={(CAT_TONE[entry.category ?? ''] ?? 'neutral') as 'primary'|'warning'|'danger'|'neutral'|'success'} />
                            <span className="ad-title-link" title={entry.title}>{entry.title}</span>
                          </div>
                          <p className="ad-desc">{stripHtml(entry.content ?? '')}</p>
                          {entry.owner_id && (
                            <div className="ad-meta">
                              <span><MiniAvatar name={shortId(entry.owner_id)} />&nbsp;{shortId(entry.owner_id)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {tab === 'active' && (
                        <td>
                          <div className="ad-date">
                            <span className="ad-date-abs">{fmtDate(dateField(entry))}</span>
                            <span className="ad-date-rel">{dateField(entry) ? timeAgo(dateField(entry) as string) : '—'}</span>
                          </div>
                        </td>
                      )}
                      {tab === 'bin' && (
                        <td>
                          <div className="ad-date">
                            <span className="ad-date-abs">{fmtDate((entry as { deleted_at?: string }).deleted_at)}</span>
                          </div>
                        </td>
                      )}
                      <td className="ad-actions">
                        {tab === 'active' && <>
                          <button className="ad-icon-btn" title="Preview" onClick={() => setPreviewItem(entry)}><I.eye width="14" height="14" /></button>
                          <button className="ad-icon-btn" title="Edit" onClick={() => { setId(entry.id); setEditTitle(entry.title); setEditDescription(entry.content); setOpen(true); }}><I.edit width="14" height="14" /></button>
                          <button className={`ad-icon-btn${entry.is_pinned ? ' is-on' : ''}`} title={entry.is_pinned ? 'Unpin' : 'Pin'} onClick={() => handlePin(entry.id)}><I.pin width="12" height="12" /></button>
                          <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(entry.id)}><I.archive width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Move to bin" onClick={() => handleMoveToBin(entry.id)}><I.trash width="14" height="14" /></button>
                        </>}
                        {tab === 'bin' && <>
                          <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestoreFromBin(entry.id)}><I.restore width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Delete permanently" onClick={() => handlePermanentDelete(entry.id)}><I.trash width="14" height="14" /></button>
                        </>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TableFoot shown={`1–${filteredData.length}`} total={filteredData.length} label="announcements" />
            </section>
          )}
        </main>
      </div>

      {/* Modals outside shell — wrapped in fixed overlay so they appear above content */}
      {open && (
        <div className="ad-modal-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <Form
              forType="announcement"
              id={id}
              initialTitle={editTitle}
              initialDescription={editDescription}
              setOpen={setOpen}
              onSuccess={() => { setOpen(false); fetchData(); }}
            />
          </div>
        </div>
      )}
      {isModalOpen && (
        <DeleteModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); fetchData(); }}
        />
      )}
      {previewItem && (
        <PublicPreviewModal
          isOpen={true}
          type="announcement"
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
};

export default Announcement;
