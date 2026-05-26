import { useState, useEffect, useCallback } from "react";
import "../_shared/admin-list.css";
import axios from "axios";
import OfficerForm from "./OfficerForm";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, BulkBar } from "../_shared/chrome";
import { Tag, MiniAvatar } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { downloadCSV, academicYear } from "../_shared/utils";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Committee { id: string; name: string; }
interface OfficerEntry {
  id: string;
  full_name: string;
  position: string | string[];
  type: string;
  avatar: string;
  socials?: string;
  year_serving?: string;
  student_number?: string;
  committee?: string | null;
  is_committee_official: boolean;
  created_at: string;
  archived_at?: string;
}

type Tab = "active" | "archived" | "bin";
type Tone = 'primary'|'warning'|'danger'|'neutral'|'success';
const TYPE_TONE: Record<string, Tone> = { executive:'primary', board:'neutral', adviser:'warning', former:'danger', member:'neutral' };

function displayPosition(pos: string | string[]): string {
  return Array.isArray(pos) ? pos[0] : pos;
}


const groupByTerm = (items: OfficerEntry[]): Record<string, OfficerEntry[]> => {
  const groups: Record<string, OfficerEntry[]> = {};
  items.forEach(item => {
    const term = item.year_serving ?? academicYear(item.archived_at ?? undefined);
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const OfficersPanel = () => {
  const PAGE_SIZE = 25;

  const [tab, setTab] = useState<Tab>("active");

  const [activeData,   setActiveData]   = useState<OfficerEntry[]>([]);
  const [archivedData, setArchivedData] = useState<OfficerEntry[]>([]);
  const [binData,      setBinData]      = useState<OfficerEntry[]>([]);
  const [committees,   setCommittees]   = useState<Committee[]>([]);
  const [activeTerm,   setActiveTerm]   = useState<string>('');

  // Track which tabs have been fetched to avoid re-fetching
  const [fetched, setFetched] = useState<Set<Tab>>(new Set());

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [_spinning, setSpinning] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<OfficerEntry | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

  // Initial load: fetch ONLY active tab + supporting data
  const fetchInitial = useCallback(async () => {
    setLoading(true); setFetchError(null); setActive([]);
    const [actRes, comRes, termRes] = await Promise.allSettled([
      axios.get<OfficerEntry[]>(`${API_URL}/officers`,  { withCredentials: true }),
      axios.get<Committee[]>(`${API_URL}/committees`,   { withCredentials: true }),
      axios.get(`${API_URL}/settings/term`,             { withCredentials: true }),
    ]);
    if (actRes.status  === 'fulfilled') setActiveData(actRes.value.data);
    if (comRes.status  === 'fulfilled') setCommittees(comRes.value.data);
    if (termRes.status === 'fulfilled') setActiveTerm(termRes.value.data?.value ?? '');
    setFetched(new Set(['active']));
    setLoading(false);
  }, []);

  // Lazy-load a specific tab (archived or bin) on first visit
  const fetchTab = useCallback(async (t: Tab) => {
    if (fetched.has(t)) return;
    setLoading(true);
    const ep = t === 'archived' ? `${API_URL}/officers/archived` : `${API_URL}/officers/bin`;
    try {
      const { data: rows } = await axios.get<OfficerEntry[]>(ep, { withCredentials: true });
      if (t === 'archived') setArchivedData(rows);
      if (t === 'bin')      setBinData(rows);
      setFetched(p => new Set([...p, t]));
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, [fetched]);

  // Re-fetch everything (used after mutations)
  const fetchAll = useCallback(async () => {
    setLoading(true); setFetchError(null); setActive([]);
    const [actRes, arcRes, binRes, comRes, termRes] = await Promise.allSettled([
      axios.get<OfficerEntry[]>(`${API_URL}/officers`,          { withCredentials: true }),
      axios.get<OfficerEntry[]>(`${API_URL}/officers/archived`, { withCredentials: true }),
      axios.get<OfficerEntry[]>(`${API_URL}/officers/bin`,      { withCredentials: true }),
      axios.get<Committee[]>(`${API_URL}/committees`,           { withCredentials: true }),
      axios.get(`${API_URL}/settings/term`,                     { withCredentials: true }),
    ]);
    if (actRes.status  === 'fulfilled') setActiveData(actRes.value.data);
    if (arcRes.status  === 'fulfilled') setArchivedData(arcRes.value.data);
    if (binRes.status  === 'fulfilled') setBinData(binRes.value.data);
    if (comRes.status  === 'fulfilled') setCommittees(comRes.value.data);
    if (termRes.status === 'fulfilled') setActiveTerm(termRes.value.data?.value ?? '');
    setFetched(new Set(['active', 'archived', 'bin']));
    setLoading(false);
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // When switching tabs, lazily fetch if not yet loaded
  useEffect(() => {
    if (tab !== 'active') fetchTab(tab);
    setOpenTerms({});
    setPage(1);       // reset to page 1 on every tab switch
  }, [tab, fetchTab]);

  // Reset to page 1 when filters/sort/search change
  useEffect(() => { setPage(1); }, [filter, sort, searchQuery]);

  const data   = tab === 'archived' ? archivedData : tab === 'bin' ? binData : activeData;
  const counts = { active: activeData.length, archived: archivedData.length, bin: binData.length };

  const committeeName = (id?: string | null) =>
    id ? (committees.find(c => c.id === id)?.name ?? '—') : '—';

  const handleActive  = (eid: string) => setActive(p => p.includes(eid) ? p.filter(a => a !== eid) : [...p, eid]);
  const handleRefresh = () => { setSpinning(true); fetchAll().finally(() => { setTimeout(() => setSpinning(false), 600); setPage(1); }); };

  const handleArchive = async (officerId: string) => {
    try {
      await axios.post(`${API_URL}/officers/archive`, {
        id: officerId,
        term_year: activeTerm || academicYear(),
      }, { withCredentials: true });
      setActiveData(p => p.filter(o => o.id !== officerId));
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setFetchError('Archive failed: ' + (d?.error ?? d?.message ?? 'Unknown'));
    }
  };

  const handleRestore = async (officerId: string) => {
    try {
      const endpoint = tab === 'bin' ? `${API_URL}/officers/restore-from-bin` : `${API_URL}/officers/restore`;
      await axios.post(endpoint, { id: officerId }, { withCredentials: true });
      if (tab === 'bin')      setBinData(p => p.filter(o => o.id !== officerId));
      if (tab === 'archived') setArchivedData(p => p.filter(o => o.id !== officerId));
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setFetchError('Restore failed: ' + (d?.error ?? d?.message ?? 'Unknown'));
    }
  };

  const handleDelete = async (officerId: string, name: string) => {
    if (tab === 'active') {
      if (!window.confirm(`Move ${name} to bin?`)) return;
      try {
        await axios.post(`${API_URL}/officers/bin`, { id: officerId }, { withCredentials: true });
        setActiveData(p => p.filter(o => o.id !== officerId));
        setActive(p => p.filter(a => a !== officerId));
      } catch { setFetchError('Move to bin failed.'); }
    } else {
      if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
      try {
        await axios.delete(`${API_URL}/officers/delete`, { data: { ids: [officerId] }, withCredentials: true });
        if (tab === 'archived') setArchivedData(p => p.filter(o => o.id !== officerId));
        if (tab === 'bin')      setBinData(p => p.filter(o => o.id !== officerId));
        setActive(p => p.filter(a => a !== officerId));
      } catch { setFetchError('Delete failed.'); }
    }
  };

  const bulkArchive = async () => {
    if (!active.length) return;
    try {
      await Promise.all(active.map(id =>
        axios.post(`${API_URL}/officers/archive`, { id, term_year: activeTerm || academicYear() }, { withCredentials: true })
      ));
      fetchAll(); setActive([]);
    } catch { setFetchError('Bulk archive failed.'); }
  };

  const bulkRestore = async () => {
    if (!active.length) return;
    try {
      const ep = tab === 'bin' ? `${API_URL}/officers/restore-from-bin` : `${API_URL}/officers/restore`;
      await Promise.all(active.map(id => axios.post(ep, { id }, { withCredentials: true })));
      fetchAll(); setActive([]);
    } catch { setFetchError('Bulk restore failed.'); }
  };

  const bulkDelete = async () => {
    if (!active.length || !window.confirm(`Delete ${active.length} officers?`)) return;
    try {
      await axios.delete(`${API_URL}/officers/delete`, { data: { ids: active }, withCredentials: true });
      fetchAll(); setActive([]);
    } catch { setFetchError('Bulk delete failed.'); }
  };

  const toggleTerm = (t: string) => setOpenTerms(p => ({ ...p, [t]: !p[t] }));
  const archivedGroups = tab === 'archived' ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isTermOpen = (t: string) => openTerms[t] !== undefined ? openTerms[t] : t === sortedTerms[0];

  const filteredData = data
    .filter(o => !filter || filter === 'All' || o.type?.toLowerCase() === filter.toLowerCase())
    .filter(o => !searchQuery ||
      o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayPosition(o.position).toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Name (A-Z)') return a.full_name.localeCompare(b.full_name);
      if (sort === 'Name (Z-A)') return b.full_name.localeCompare(a.full_name);
      return 0;
    });

  const handleExportCSV = () => downloadCSV(
    filteredData.map(o => ({
      Name: o.full_name, Position: displayPosition(o.position),
      Type: o.type ?? '—', Committee: committeeName(o.committee),
      Term: o.year_serving ?? '—', 'Student No.': o.student_number ?? '—',
    })), 'officers'
  );

  const ORow = ({ o }: { o: OfficerEntry }) => {
    const tone = TYPE_TONE[o.type?.toLowerCase()] ?? 'neutral';
    return (
      <tr className={active.includes(o.id) ? 'is-selected' : ''}>
        <td><input type="checkbox" checked={active.includes(o.id)} onChange={() => handleActive(o.id)} /></td>
        <td>
          {o.avatar
            ? <img src={o.avatar} alt={o.full_name} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
            : <MiniAvatar name={o.full_name} />}
        </td>
        <td>
          <div className="ad-title-row">
            <Tag label={o.type ?? '—'} tone={tone} />
            <a className="ad-title-link">{o.full_name}</a>
          </div>
        </td>
        <td>
          <span style={{ display:'block', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13.5, color:'var(--color-text-primary)' }}>
            {displayPosition(o.position)}
          </span>
        </td>
        <td>
          {/* Clamp to 1 line — prevents row height inconsistency */}
          <span style={{ display:'block', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13, color:'var(--color-text-secondary)' }}>
            {o.committee ? committeeName(o.committee) : <span className="ad-cell-muted">—</span>}
          </span>
        </td>
        <td><span className="ad-mono ad-cell-muted">{o.year_serving ?? '—'}</span></td>
        <td className="ad-actions">
          {tab === 'active' && <>
            <button className="ad-icon-btn" title="Edit" onClick={() => { setEditId(o.id); setEditData(o); setOpen(true); }}><I.edit width="14" height="14" /></button>
            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(o.id)}><I.archive width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Move to bin" onClick={() => handleDelete(o.id, o.full_name)}><I.trash width="14" height="14" /></button>
          </>}
          {(tab === 'archived' || tab === 'bin') && <>
            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(o.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handleDelete(o.id, o.full_name)}><I.trash width="14" height="14" /></button>
          </>}
        </td>
      </tr>
    );
  };

  // Paginated table — renders only PAGE_SIZE rows at a time
  const OfficerTable = ({ rows, empty }: { rows: OfficerEntry[]; empty: string }) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages);
    const pageRows   = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const from       = rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to         = Math.min(safePage * PAGE_SIZE, rows.length);

    return (
      <section className="ad-card">
        <table className="ad-table">
          <colgroup><col style={{width:44}}/><col style={{width:44}}/><col style={{minWidth:180}}/><col/><col/><col style={{width:110}}/><col style={{width:130}}/></colgroup>
          <thead><tr>
            <th><input type="checkbox" checked={pageRows.length>0&&pageRows.every(o=>active.includes(o.id))} onChange={()=>setActive(pageRows.every(o=>active.includes(o.id))?active.filter(id=>!pageRows.find(o=>o.id===id)):[...new Set([...active,...pageRows.map(o=>o.id)])])} /></th>
            <th /><th>Name</th><th>Position</th><th>Committee</th><th>Term</th><th className="ad-th-right">Actions</th>
          </tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={7}><div className="ad-empty"><p>{empty}</p></div></td></tr>}
            {pageRows.map(o => <ORow key={o.id} o={o} />)}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="ad-table-foot">
          <span className="ad-foot-count">
            Showing <strong>{from}–{to}</strong> of <strong>{rows.length}</strong> officers
          </span>
          {totalPages > 1 && (
            <div className="ad-foot-pager">
              <button className="ad-page-btn" disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>‹ Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(n); return acc;
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} style={{ padding:'0 4px', color:'var(--color-text-muted)' }}>…</span>
                  : <button key={n} className={`ad-page-btn${n === safePage ? ' is-active' : ''}`}
                      onClick={() => setPage(n as number)}>{n}</button>
                )}
              <button className="ad-page-btn" disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next ›</button>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="officers" />
        <main className="ad-main">
          <PageHead
            title="Officers"
            subtitle="Manage the executive board, board members, advisers, and former officers."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              <button className="ad-btn-ghost" onClick={handleExportCSV}><I.download width="14" height="14" />Export CSV</button>
              {tab === 'active' && <button className="ad-btn-primary" onClick={() => { setEditId(null); setEditData(undefined); setOpen(true); }}><I.plus width="14" height="14" />Add officer</button>}
            </>}
          />

          <Tabs items={[
            { label:'Active',   active: tab==='active',   count: counts.active   || undefined },
            { label:'Archived', active: tab==='archived', count: counts.archived || undefined },
            { label:'Bin',      active: tab==='bin',      count: counts.bin      || undefined },
          ]} onTabChange={l => setTab(l.toLowerCase() as Tab)} />

          <Toolbar placeholder="Search officers by name or position…" search={searchQuery} onSearch={setSearchQuery} onRefresh={handleRefresh} showSort={false}>
            <span className="ad-filter-label">Type</span>
            <select className="ad-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All types</option>
              <option value="executive">Executive</option>
              <option value="board">Board</option>
              <option value="adviser">Adviser</option>
              <option value="member">Member</option>
              <option value="former">Former</option>
            </select>
            <span className="ad-filter-label">Sort</span>
            <select className="ad-filter-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Default</option>
              <option value="Name (A-Z)">A → Z</option>
              <option value="Name (Z-A)">Z → A</option>
            </select>
          </Toolbar>

          {fetchError && <p style={{ fontSize:13, color:'var(--color-danger-text)' }}>{fetchError}</p>}

          {tab === 'active'                    && <BulkBar count={active.length} actions={['Archive','Delete']} handlers={{ Archive: bulkArchive, Delete: bulkDelete }} onClear={() => setActive([])} />}
          {(tab==='archived'||tab==='bin')     && <BulkBar count={active.length} actions={['Restore','Delete']} handlers={{ Restore: bulkRestore, Delete: bulkDelete }} onClear={() => setActive([])} />}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : tab === 'archived' ? (
            <>
              {sortedTerms.length === 0 && <section className="ad-card"><div className="ad-empty"><p>No archived officers.</p></div></section>}
              {sortedTerms.map(term => (
                <section key={term} className="ad-card" style={{ marginBottom: '0.75rem' }}>
                  <button className="ad-term-toggle" onClick={() => toggleTerm(term)}>
                    <span>Term {term}</span>
                    <span className="ad-term-meta">
                      {archivedGroups[term].length} officer{archivedGroups[term].length !== 1 ? 's' : ''}
                      <I.chev width="13" height="13" style={{ transform: isTermOpen(term) ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                    </span>
                  </button>
                  {isTermOpen(term) && <OfficerTable rows={archivedGroups[term]} empty="No officers in this term." />}
                </section>
              ))}
            </>
          ) : tab === 'bin' ? (
            <OfficerTable rows={filteredData} empty="No deleted officers." />
          ) : (
            <OfficerTable rows={filteredData} empty="No officers found." />
          )}
        </main>
      </div>

      {open && (
        <div className="ad-modal-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <OfficerForm
              id={editId}
              initialData={editData ? {
                ...editData,
                position: Array.isArray(editData.position)
                  ? editData.position.join(', ')
                  : editData.position,
              } : undefined}
              activeTerm={activeTerm}
              setOpen={setOpen}
              onSuccess={() => { setOpen(false); fetchAll(); }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default OfficersPanel;
