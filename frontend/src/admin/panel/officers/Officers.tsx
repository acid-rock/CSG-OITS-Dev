import { useState, useEffect, useCallback } from "react";
import "../_shared/admin-list.css";
import axios from "axios";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import OfficerForm from "./OfficerForm";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from "../_shared/chrome";
import { Tag, MiniAvatar } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { fmtDate, timeAgo, downloadCSV } from "../_shared/utils";

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
const TYPE_TONE: Record<string, Tone> = { executive:'primary', board:'neutral', adviser:'warning', former:'danger' };

function displayPosition(pos: string | string[]): string {
  return Array.isArray(pos) ? pos[0] : pos;
}

const groupByTerm = (items: OfficerEntry[]): Record<string, OfficerEntry[]> => {
  const groups: Record<string, OfficerEntry[]> = {};
  items.forEach(item => {
    const term = item.year_serving ?? "Unknown Term";
    if (!groups[term]) groups[term] = [];
    groups[term].push(item);
  });
  return groups;
};

const OfficersPanel = () => {
  const [tab, setTab] = useState<Tab>("active");
  const [data, setData] = useState<OfficerEntry[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<OfficerEntry | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError(null); setActive([]);
    try {
      const ep = tab === "archived" ? `${API_URL}/officers/archived`
        : tab === "bin" ? `${API_URL}/officers/bin`
        : `${API_URL}/officers`;
      const [officersRes, committeesRes] = await Promise.all([
        axios.get<OfficerEntry[]>(ep, { withCredentials: true }),
        axios.get<Committee[]>(`${API_URL}/committees`, { withCredentials: true }),
      ]);
      setData(officersRes.data);
      setCommittees(committeesRes.data);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Failed to load officers."); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setOpenTerms({}); }, [tab]);

  // committees.id is UUID — compare raw strings, never parseInt
  const committeeName = (id?: string | null) =>
    id ? (committees.find(c => c.id === id)?.name ?? "—") : "—";

  const handleActive = (eid: string) => setActive(p => p.includes(eid) ? p.filter(a => a !== eid) : [...p, eid]);
  const handleRefresh = () => { setSpinning(true); fetchData().finally(() => setTimeout(() => setSpinning(false), 600)); };

  const handleArchive = async (officerId: string) => {
    try {
      // Backend /archive expects { id, term_year } — singular id, not ids array
      await axios.post(`${API_URL}/officers/archive`, {
        id: officerId,
        term_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      }, { withCredentials: true });
      setData(p => p.filter(o => o.id !== officerId));
    } catch (err: unknown) {
      setFetchError("Failed to archive: " + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unknown"));
    }
  };
  const handleRestore = async (officerId: string) => {
    try {
      // Archived tab → /restore (sets status back to active)
      // Bin tab → /restore-from-bin (clears deleted_at)
      const endpoint = tab === 'bin'
        ? `${API_URL}/officers/restore-from-bin`
        : `${API_URL}/officers/restore`;
      // Both endpoints use singleIdSchema: { id: uuid } — NOT { ids: [...] }
      await axios.post(endpoint, { id: officerId }, { withCredentials: true });
      setData(p => p.filter(o => o.id !== officerId));
    }
    catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setFetchError("Restore failed: " + (d?.error ?? d?.message ?? "Unknown"));
    }
  };
  const handleDelete = async (officerId: string, name: string) => {
    if (tab === 'active') {
      // Active tab: move to bin (soft delete), NOT permanent
      if (!window.confirm(`Move ${name} to bin?`)) return;
      try {
        await axios.post(`${API_URL}/officers/bin`, { id: officerId }, { withCredentials: true });
        setData(p => p.filter(o => o.id !== officerId)); setActive(p => p.filter(a => a !== officerId));
      } catch (err: unknown) { setFetchError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Move to bin failed."); }
    } else {
      // Archived or Bin tab: permanent delete
      if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
      try {
        await axios.delete(`${API_URL}/officers/delete`, { data: { ids: [officerId] }, withCredentials: true });
        setData(p => p.filter(o => o.id !== officerId)); setActive(p => p.filter(a => a !== officerId));
      } catch (err: unknown) { setFetchError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Delete failed."); }
    }
  };

  const bulkArchive = async () => {
    if (!active.length) return;
    const termYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    try {
      // Backend only supports single-id archive — call once per officer
      await Promise.all(active.map(id =>
        axios.post(`${API_URL}/officers/archive`, { id, term_year: termYear }, { withCredentials: true })
      ));
      fetchData(); setActive([]);
    } catch (err: unknown) { setFetchError("Bulk archive failed: " + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unknown")); }
  };
  const bulkRestore = async () => {
    if (!active.length) return;
    try {
      const endpoint = tab === 'bin'
        ? `${API_URL}/officers/restore-from-bin`
        : `${API_URL}/officers/restore`;
      // Both endpoints are single-id; call once per officer in parallel
      await Promise.all(active.map(id =>
        axios.post(endpoint, { id }, { withCredentials: true })
      ));
      fetchData(); setActive([]);
    }
    catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setFetchError("Bulk restore failed: " + (d?.error ?? d?.message ?? "Unknown"));
    }
  };
  const bulkDelete = async () => {
    if (!active.length || !window.confirm(`Delete ${active.length} officers?`)) return;
    try { await axios.delete(`${API_URL}/officers/delete`, { data: { ids: active }, withCredentials: true }); fetchData(); setActive([]); }
    catch (err: unknown) { setFetchError("Bulk delete failed: " + ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unknown")); }
  };

  const toggleTerm = (t: string) => setOpenTerms(p => ({ ...p, [t]: !p[t] }));
  const archivedGroups = tab === "archived" ? groupByTerm(data) : {};
  const sortedTerms = Object.keys(archivedGroups).sort((a, b) => b.localeCompare(a));
  const isTermOpen = (t: string) => openTerms[t] !== undefined ? openTerms[t] : t === sortedTerms[0];

  const typeOptions = ["All","Executive","Board","Adviser","Former"];

  const filteredData = data
    .filter(o => !filter || filter === "All" || o.type?.toLowerCase() === filter.toLowerCase())
    .filter(o => !searchQuery || o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || displayPosition(o.position).toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === "Name (A-Z)") return a.full_name.localeCompare(b.full_name);
      if (sort === "Name (Z-A)") return b.full_name.localeCompare(a.full_name);
      return 0;
    });

  const handleExportCSV = () => {
    downloadCSV(
      filteredData.map(o => ({
        Name: o.full_name,
        Position: displayPosition(o.position),
        Type: o.type ?? '—',
        Committee: committeeName(o.committee),
        Term: o.year_serving ?? '—',
        'Student No.': o.student_number ?? '—',
      })),
      'officers'
    );
  };

  const ORow = ({ o }: { o: OfficerEntry }) => {
    const tone = TYPE_TONE[o.type?.toLowerCase()] ?? 'neutral';
    const initials = o.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <tr className={active.includes(o.id) ? 'is-selected' : ''}>
        <td><input type="checkbox" checked={active.includes(o.id)} onChange={() => handleActive(o.id)} /></td>
        <td>
          {o.avatar
            ? <img src={o.avatar} alt={o.full_name} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
            : <MiniAvatar name={initials} />}
        </td>
        <td>
          <div className="ad-title-row">
            <Tag label={o.type ?? '—'} tone={tone} />
            <a className="ad-title-link">{o.full_name}</a>
          </div>
        </td>
        <td><span className="ad-cell-text" style={{ display:'block', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayPosition(o.position)}</span></td>
        <td>{o.committee ? <span className="ad-cell-text">{committeeName(o.committee)}</span> : <span className="ad-cell-muted">—</span>}</td>
        <td><span className="ad-mono ad-cell-muted">{o.year_serving ?? '—'}</span></td>
        <td className="ad-actions">
          {tab === 'active' && <>
            <button className="ad-icon-btn" title="Edit" onClick={() => { setEditId(o.id); setEditData(o); setOpen(true); }}><I.edit width="14" height="14" /></button>
            <button className="ad-icon-btn" title="Archive" onClick={() => handleArchive(o.id)}><I.archive width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handleDelete(o.id, o.full_name)}><I.trash width="14" height="14" /></button>
          </>}
          {(tab === 'archived' || tab === 'bin') && <>
            <button className="ad-icon-btn is-on" title="Restore" onClick={() => handleRestore(o.id)}><I.restore width="14" height="14" /></button>
            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handleDelete(o.id, o.full_name)}><I.trash width="14" height="14" /></button>
          </>}
        </td>
      </tr>
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
            { label:'Active',   active: tab==='active',   count: tab==='active'   ? data.length : undefined },
            { label:'Archived', active: tab==='archived', count: tab==='archived' ? data.length : undefined },
            { label:'Bin',      active: tab==='bin',      count: tab==='bin'      ? data.length : undefined },
          ]} onTabChange={(l) => setTab(l.toLowerCase() as Tab)} />
          <Toolbar
            placeholder="Search officers by name or position…"
            search={searchQuery} onSearch={setSearchQuery}
            onRefresh={handleRefresh}
            showSort={false}
          >
            <span className="ad-filter-label">Type</span>
            <select
              className="ad-filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">All types</option>
              <option value="Executive">Executive</option>
              <option value="Board">Board</option>
              <option value="Adviser">Adviser</option>
              <option value="Former">Former</option>
            </select>
            <span className="ad-filter-label">Sort</span>
            <select
              className="ad-filter-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="">Default</option>
              <option value="Name (A-Z)">A → Z</option>
              <option value="Name (Z-A)">Z → A</option>
            </select>
          </Toolbar>
          {fetchError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{fetchError}</p>}
          {tab === 'active'             && <BulkBar count={active.length} actions={['Archive','Delete']} handlers={{ Archive: bulkArchive, Delete: bulkDelete }} onClear={() => setActive([])} />}
          {(tab==='archived'||tab==='bin') && <BulkBar count={active.length} actions={['Restore','Delete']} handlers={{ Restore: bulkRestore, Delete: bulkDelete }} onClear={() => setActive([])} />}

          {loading ? (
            <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
          ) : tab === 'archived' ? (
            <>
              {sortedTerms.length === 0 && <section className="ad-card"><div className="ad-empty"><p>No archived officers.</p></div></section>}
              {sortedTerms.map(term => (
                <div key={term}>
                  <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,color:'var(--color-text-primary)',padding:'8px 0'}} onClick={() => toggleTerm(term)}>
                    <I.chev width="14" height="14" style={{transform:isTermOpen(term)?'rotate(180deg)':undefined,transition:'transform 150ms'}}/>
                    {term} <span style={{fontWeight:500,color:'var(--color-text-muted)',fontSize:12}}>({archivedGroups[term].length})</span>
                  </button>
                  {isTermOpen(term) && (
                    <section className="ad-card" style={{marginBottom:8}}>
                      <table className="ad-table">
                        <thead><tr><th><input type="checkbox"/></th><th></th><th>Name</th><th>Position</th><th>Committee</th><th>Term</th><th className="ad-th-right">Actions</th></tr></thead>
                        <tbody>{archivedGroups[term].map(o => <ORow key={o.id} o={o} />)}</tbody>
                      </table>
                    </section>
                  )}
                </div>
              ))}
            </>
          ) : (
            <section className="ad-card">
              <table className="ad-table">
                <colgroup><col style={{width:44}}/><col style={{width:44}}/><col style={{minWidth:200}}/><col/><col style={{width:240}}/><col style={{width:120}}/><col style={{width:130}}/></colgroup>
                <thead><tr>
                  <th><input type="checkbox" checked={filteredData.length>0&&filteredData.every(o=>active.includes(o.id))} onChange={() => setActive(filteredData.every(o=>active.includes(o.id)) ? [] : filteredData.map(o=>o.id))} /></th>
                  <th></th><th>Name</th><th>Position</th><th>Committee</th><th>Term</th><th className="ad-th-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredData.length===0 && <tr><td colSpan={7}><div className="ad-empty"><p>{tab==='bin'?'No deleted officers.':'No officers found.'}</p></div></td></tr>}
                  {filteredData.map(o => <ORow key={o.id} o={o} />)}
                </tbody>
              </table>
              <TableFoot shown={`1–${filteredData.length}`} total={filteredData.length} label="officers" />
            </section>
          )}
        </main>
      </div>
      {open && (
        <div className="ad-modal-overlay" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <OfficerForm id={editId} initialData={editData} setOpen={setOpen} onSuccess={() => { setOpen(false); fetchData(); }} />
          </div>
        </div>
      )}
      {isModalOpen && deleteId && <DeleteModal onClose={() => { setIsModalOpen(false); setDeleteId(null); }} onSuccess={() => { setIsModalOpen(false); setDeleteId(null); fetchData(); }} />}
    </>
  );
};

export default OfficersPanel;
