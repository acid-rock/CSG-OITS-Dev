import { useState, useEffect, useCallback } from 'react';
import '../_shared/admin-list.css';
import Form from '../../components/form/Form';
import PublicPreviewModal from '../../components/modals/PublicPreviewModal/PublicPreviewModal';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { Thumb, StatusPill } from '../_shared/atoms';
import { I } from '../_shared/icons';
import { timeAgo, fmtDate, stripHtml } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface EventEntry {
  id: string;
  name: string;
  description: string;
  date: string;
  created_at: string;
  images: string[];
  archived_at?: string;
  deleted_at?: string;
}

type Tab = 'active' | 'archived' | 'bin';

const filterByDate = (date: string, filter: string): boolean => {
  if (!filter || filter === 'All') return true;
  const d = new Date(date);
  const now = new Date();
  if (filter === 'Today') return d.toDateString() === now.toDateString();
  if (filter === 'This Week') {
    const sow = new Date(now); sow.setDate(now.getDate() - now.getDay()); sow.setHours(0,0,0,0);
    return d >= sow;
  }
  if (filter === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
};

function eventStatus(dateStr: string): { label: string; tone: 'primary'|'success'|'neutral' } {
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const ev = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (ev < today) return { label: 'Past',     tone: 'neutral'  };
  if (ev.getTime() === today.getTime()) return { label: 'Ongoing',  tone: 'success'  };
  return { label: 'Upcoming', tone: 'primary' };
}

const groupByTerm = (items: EventEntry[]): Record<string, EventEntry[]> => {
  const groups: Record<string, EventEntry[]> = {};
  items.forEach(item => {
    const year = item.archived_at ? new Date(item.archived_at).getFullYear() : new Date().getFullYear();
    const term = `${year}–${year + 1}`;
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const Events = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<EventEntry | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null); setActive([]);
    try {
      const ep = tab === 'archived' ? `${API_URL}/events/archived`
        : tab === 'bin' ? `${API_URL}/events/bin` : `${API_URL}/events`;
      const { data: r } = await axios.get(ep, { withCredentials: true });
      setData(r);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : 'Failed to load events.'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  const handleActive = (eid: string) => setActive(p => p.includes(eid) ? p.filter(x => x !== eid) : [...p, eid]);
  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };

  const handleArchive = async (eid: string) => {
    try { await axios.post(`${API_URL}/events/archive`, { ids: [eid] }, { withCredentials: true }); setData(p => p.filter(e => e.id !== eid)); }
    catch (err: unknown) { setFetchError('Archive failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleMoveToBin = async (eid: string) => {
    try { await axios.post(`${API_URL}/events/bin`, { ids: [eid] }, { withCredentials: true }); setData(p => p.filter(e => e.id !== eid)); }
    catch (err: unknown) { setFetchError('Move to bin failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleRestore = async (eid: string) => {
    try { await axios.post(`${API_URL}/events/restore`, { ids: [eid] }, { withCredentials: true }); setData(p => p.filter(e => e.id !== eid)); }
    catch (err: unknown) { setFetchError('Restore failed: ' + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unknown')); }
  };
  const handleRestoreFromBin = async (eid: string) => { try { await axios.post(`${API_URL}/events/restore-from-bin`, { ids: [eid] }, { withCredentials: true }); setData(p => p.filter(e => e.id !== eid)); } catch { fetchData(); } };
  const handlePermanentDelete = async (eid: string) => {
    if (!window.confirm('Permanently delete?')) return;
    await axios.delete(`${API_URL}/events/delete`, { data: { ids: [eid] }, withCredentials: true });
    setData(p => p.filter(e => e.id !== eid));
  };

  const bulkArchive = async () => { if (!active.length) return; await axios.post(`${API_URL}/events/archive`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkBin = async () => { if (!active.length) return; await axios.post(`${API_URL}/events/bin`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkRestore = async () => { if (!active.length) return; await axios.post(`${API_URL}/events/restore`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkRestoreFromBin = async () => { if (!active.length) return; await axios.post(`${API_URL}/events/restore-from-bin`, { ids: active }, { withCredentials: true }); fetchData(); setActive([]); };
  const bulkDelete = async () => {
    if (!active.length || !window.confirm(`Delete ${active.length} events?`)) return;
    await Promise.all(active.map(eid => axios.delete(`${API_URL}/events/delete`, { data: { id: eid }, withCredentials: true })));
    fetchData(); setActive([]);
  };

  const toggleTerm = (t: string) => setOpenTerms(p => ({ ...p, [t]: !p[t] }));
  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isTermOpen = (t: string) => openTerms[t] !== undefined ? openTerms[t] : t === sortedTerms[0];

  const filteredData = data
    .filter(e => filterByDate(e.date || e.created_at, filter))
    .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(e.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
      if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
      if (sort === 'Date (Newest)') return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime();
      if (sort === 'Date (Oldest)') return new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime();
      return 0;
    });


  const EvRow = ({ e }: { e: EventEntry }) => {
    const { label, tone } = eventStatus(e.date || e.created_at);
    return (
      <tr className={active.includes(e.id) ? 'is-selected' : ''}>
        <td><input type="checkbox" checked={active.includes(e.id)} onChange={() => handleActive(e.id)} /></td>
        <td><Thumb src={e.images?.[0] || null} title={e.name} /></td>
        <td>
          <div className="ad-title-stack">
            <span className="ad-title-link" title={e.name}>{e.name}</span>
            <p className="ad-desc">{stripHtml(e.description ?? '')}</p>
          </div>
        </td>
        <td>
          <div className="ad-date">
            <span className="ad-date-abs">{fmtDate(e.date || e.created_at)}</span>
            <span className="ad-date-rel">{e.created_at ? timeAgo(e.created_at) : '—'}</span>
          </div>
        </td>
        {tab === 'active' && <td><StatusPill label={label} tone={tone} /></td>}
        <td className="ad-actions">
          {tab === 'active' && <>
            <button className="ad-icon-btn" title="Preview" onClick={() => setPreviewItem(e)}><I.eye width="14" height="14" /></button>
            <button className="ad-icon-btn" title="Edit" onClick={() => { setId(e.id); setEditTitle(e.name); setEditDescription(e.description); setEditDate(e.date); setEditImages(e.images); setOpen(true); }}><I.edit width="14" height="14" /></button>
            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(e.id)}><I.archive width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to bin" onClick={() => handleMoveToBin(e.id)}><I.trash width="14" height="14" /></button>
          </>}
          {tab === 'archived' && <>
            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(e.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handlePermanentDelete(e.id)}><I.trash width="14" height="14" /></button>
          </>}
          {tab === 'bin' && <>
            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestoreFromBin(e.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete permanently" onClick={() => handlePermanentDelete(e.id)}><I.trash width="14" height="14" /></button>
          </>}
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="events" />
        <main className="ad-main">
          <PageHead
            title="Events"
            subtitle="Schedule and manage CSG events. Active events appear on the public Events page."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {tab === 'active' && <button className="ad-btn-primary" onClick={() => { setId(null); setEditTitle(''); setEditDescription(''); setEditDate(''); setEditImages([]); setOpen(true); }}><I.plus width="14" height="14" />New event</button>}
            </>}
          />
          <Tabs items={[
            { label:'Active', active: tab==='active', count: tab==='active' ? data.length : undefined },
            { label:'Archived', active: tab==='archived', count: tab==='archived' ? data.length : undefined },
            { label:'Bin', active: tab==='bin', count: tab==='bin' ? data.length : undefined },
          ]} onTabChange={(l) => setTab(l.toLowerCase() as Tab)} />
          <Toolbar
            placeholder="Search events by title or description…"
            search={searchQuery} onSearch={setSearchQuery}
            onRefresh={handleRefresh}
            showSort={false}
          >
            <span className="ad-filter-label">Date</span>
            <select
              className="ad-filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">All dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This week</option>
              <option value="This Month">This month</option>
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
          {fetchError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{fetchError}</p>}
          {tab === 'active'   && <BulkBar count={active.length} actions={['Archive','Delete']} handlers={{ Archive: bulkArchive, Delete: bulkBin }} onClear={() => setActive([])} />}
          {tab === 'archived' && <BulkBar count={active.length} actions={['Restore','Delete']} handlers={{ Restore: bulkRestore, Delete: bulkDelete }} onClear={() => setActive([])} />}
          {tab === 'bin'      && <BulkBar count={active.length} actions={['Restore','Delete']} handlers={{ Restore: bulkRestoreFromBin, Delete: bulkDelete }} onClear={() => setActive([])} />}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : tab === 'archived' ? (
            <>
              {sortedTerms.length === 0 && <section className="ad-card"><div className="ad-empty"><p>No archived events.</p></div></section>}
              {sortedTerms.map(term => (
                <div key={term}>
                  <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,color:'var(--color-text-primary)',padding:'8px 0'}} onClick={() => toggleTerm(term)}>
                    <I.chev width="14" height="14" style={{ transform: isTermOpen(term) ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
                    {term} <span style={{fontWeight:500,color:'var(--color-text-muted)',fontSize:12}}>({archivedGroups[term].length})</span>
                  </button>
                  {isTermOpen(term) && (
                    <section className="ad-card" style={{marginBottom:8}}>
                      <table className="ad-table">
                        <thead><tr><th><input type="checkbox" /></th><th>Photo</th><th>Title</th><th>Date</th><th className="ad-th-right">Actions</th></tr></thead>
                        <tbody>{archivedGroups[term].map(e => <EvRow key={e.id} e={e} />)}</tbody>
                      </table>
                    </section>
                  )}
                </div>
              ))}
            </>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{width:44}}/><col style={{width:72}}/><col/><col style={{width:140}}/>{tab==='active'&&<col style={{width:130}}/>}<col style={{width:160}}/></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filteredData.length>0 && filteredData.every(e=>active.includes(e.id))} onChange={() => setActive(filteredData.every(e=>active.includes(e.id)) ? [] : filteredData.map(e=>e.id))} /></th>
                  <th>Photo</th><th>Title &amp; description</th><th>Date</th>
                  {tab==='active' && <th>Status</th>}
                  <th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredData.length===0 && <tr><td colSpan={tab==='active'?6:5}><div className="ad-empty"><p>{tab==='bin'?'Bin is empty.':'No events found.'}</p></div></td></tr>}
                  {filteredData.map(e => <EvRow key={e.id} e={e} />)}
                </tbody>
              </table>
              <TableFoot shown={`1–${filteredData.length}`} total={filteredData.length} label="events" />
            </section>
          )}
        </main>
      </div>
      {open && (
        <div className="ad-modal-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <Form
              forType="event"
              id={id}
              initialTitle={editTitle}
              initialDescription={editDescription}
              initialDate={editDate}
              initialImages={editImages}
              setOpen={setOpen}
              onSuccess={() => { setOpen(false); fetchData(); }}
            />
          </div>
        </div>
      )}
      {previewItem && (
        <PublicPreviewModal
          isOpen={true}
          type="event"
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
      {isModalOpen && <div onClick={() => setIsModalOpen(false)} />}
    </>
  );
};

export default Events;
