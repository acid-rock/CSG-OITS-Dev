import { useState, useEffect, useCallback, useRef } from 'react';
import '../_shared/admin-list.css';
import axios from 'axios';
import Sidebar from '../_shared/Sidebar';
import { PageHead, Tabs, Toolbar, BulkBar, TableFoot } from '../_shared/chrome';
import { Thumb, StatusPill, MiniAvatar } from '../_shared/atoms';
import { I } from '../_shared/icons';
import { fmtDate } from '../_shared/utils';

const API_URL = import.meta.env.VITE_API_URL as string;

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
}

interface EquipmentItem { equipment_id: string; quantity_requested: number; }

interface BorrowRequest {
  id: string;
  borrower_name: string;
  borrower_id: string;
  borrower_email?: string;
  contact_number?: string;
  organization?: string;
  position_in_org?: string;
  equipment_id: string;
  equipment_name: string;
  quantity_requested: number;
  equipment_items?: EquipmentItem[];
  purpose?: string;
  purpose_type?: string;
  purpose_others_detail?: string;
  activity_name?: string;
  venue?: string;
  time_of_use?: string;
  borrow_date: string;
  return_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  admin_notes?: string;
  created_at: string;
}

type AdminTab = 'requests' | 'inventory';
type ConfirmType = 'approve' | 'reject' | null;
type Tone = 'primary'|'warning'|'danger'|'neutral'|'success';

const BORROW_TONE: Record<string, Tone> = { pending:'warning', approved:'primary', returned:'neutral', rejected:'danger' };

/* ── Inventory form (inline, same logic as before) ── */
interface InventoryFormProps { initial?: InventoryItem; onSuccess: () => void; onCancel: () => void; }

const InventoryForm = ({ initial, onSuccess, onCancel }: InventoryFormProps) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [maxQty, setMaxQty] = useState(String(initial?.max_quantity ?? ''));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name); fd.append('max_quantity', maxQty);
      if (imageFile) fd.append('image', imageFile);
      if (initial) { fd.append('id', initial.id); await axios.post(`${API_URL}/borrowing/inventory/edit`, fd, { withCredentials: true }); }
      else { await axios.post(`${API_URL}/borrowing/inventory/add`, fd, { withCredentials: true }); }
      onSuccess();
    } catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:420, padding:'18px 20px', border:'1px solid var(--color-border-soft)', borderRadius:14, background:'#fafbff', marginBottom:16 }}>
      <strong style={{ fontSize:14, fontWeight:700, color:'var(--color-text-primary)' }}>{initial ? 'Edit Equipment' : 'Add Equipment'}</strong>
      <div onClick={() => fileRef.current?.click()} style={{ width:80, height:80, border:'2px dashed var(--color-border)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden' }}>
        {imagePreview ? <img src={imagePreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <I.upload width="20" height="20" style={{ color:'var(--color-text-hint)' }} />}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange} />
      <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="Equipment name *"
        style={{ padding:'9px 12px', border:'1.5px solid var(--color-border)', borderRadius:10, fontFamily:'inherit', fontSize:13 }} />
      <input type="number" min={1} value={maxQty} onChange={e=>setMaxQty(e.target.value)} required placeholder="Total units *"
        style={{ padding:'9px 12px', border:'1.5px solid var(--color-border)', borderRadius:10, fontFamily:'inherit', fontSize:13 }} />
      {error && <p style={{ color:'var(--color-danger-text)', fontSize:13, margin:0 }}>{error}</p>}
      <div style={{ display:'flex', gap:10 }}>
        <button type="submit" className="ad-btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button type="button" className="ad-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

/* ── Main borrowing panel ── */
const BorrowingPanel = () => {
  const [tab, setTab] = useState<AdminTab>('requests');
  const [viewRequest, setViewRequest] = useState<BorrowRequest | null>(null);

  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [reqSort, setReqSort] = useState('newest');
  const [requestSearch, setRequestSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<string[]>([]);

  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const [confirmRequestId, setConfirmRequestId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | undefined>(undefined);
  const [inventorySearch, setInventorySearch] = useState('');

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true); setRequestsError(null);
    try {
      const params = statusFilter !== 'all' ? { params: { status: statusFilter } } : {};
      const { data } = await axios.get(`${API_URL}/borrowing/requests`, { withCredentials: true, ...params });
      setRequests(data);
    } catch { setRequestsError('Failed to load borrow requests.'); }
    finally { setRequestsLoading(false); }
  }, [statusFilter]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true); setInventoryError(null);
    try { const { data } = await axios.get(`${API_URL}/borrowing/inventory`, { withCredentials: true }); setInventory(data); }
    catch { setInventoryError('Failed to load inventory.'); }
    finally { setInventoryLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openConfirm = (type: 'approve' | 'reject', id: string) => { setConfirmType(type); setConfirmRequestId(id); setConfirmNotes(''); setConfirmError(null); };
  const closeConfirm = () => { setConfirmType(null); setConfirmRequestId(null); setConfirmNotes(''); setConfirmError(null); };

  const handleConfirmAction = async () => {
    if (!confirmType || !confirmRequestId) return;
    setConfirmSubmitting(true); setConfirmError(null);
    try {
      const ep = confirmType === 'approve' ? '/borrowing/approve' : '/borrowing/reject';
      await axios.post(`${API_URL}${ep}`, { request_id: confirmRequestId, admin_notes: confirmNotes || undefined }, { withCredentials: true });
      closeConfirm(); fetchRequests(); fetchInventory();
    } catch (err: unknown) { setConfirmError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.'); }
    finally { setConfirmSubmitting(false); }
  };

  const handleReturn = async (id: string) => {
    try { await axios.post(`${API_URL}/borrowing/return`, { request_id: id }, { withCredentials: true }); fetchRequests(); fetchInventory(); }
    catch { /* ignore */ }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Delete this request?')) return;
    try { await axios.delete(`${API_URL}/borrowing/requests/delete`, { data: { ids: [id] }, withCredentials: true }); setRequests(p => p.filter(r => r.id !== id)); }
    catch { /* ignore */ }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!window.confirm('Delete this equipment?')) return;
    try { await axios.delete(`${API_URL}/borrowing/inventory/delete`, { data: { id }, withCredentials: true }); setInventory(p => p.filter(i => i.id !== id)); }
    catch (err: unknown) { setInventoryError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed.'); }
  };

  const statusOptions = ['all','pending','approved','rejected','returned'];

  const filteredReqs = requests
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => !purposeFilter || (r.purpose_type ?? '').toLowerCase() === purposeFilter)
    .filter(r => !requestSearch || r.borrower_name.toLowerCase().includes(requestSearch.toLowerCase()) || r.borrower_id.toLowerCase().includes(requestSearch.toLowerCase()) || r.equipment_name.toLowerCase().includes(requestSearch.toLowerCase()))
    .sort((a, b) => reqSort === 'oldest'
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const filteredInv = inventory.filter(i => !inventorySearch || i.name.toLowerCase().includes(inventorySearch.toLowerCase()));

  const invStatus = (i: InventoryItem): { label: string; tone: Tone } => {
    if (!i.is_available) return { label: 'Unavailable', tone: 'danger' };
    if (i.quantity === 0)  return { label: 'Borrowed',   tone: 'warning' };
    return { label: 'Available', tone: 'success' };
  };

  return (
    <>
      <div className="ad-shell">
        <Sidebar active="borrowing" />
        <main className="ad-main">
          <PageHead
            title="Equipment"
            subtitle="Approve borrow requests and manage the CSG inventory."
            actions={<>
              <button className="ad-btn-ghost" onClick={() => window.print()}><I.print width="14" height="14" />Print</button>
              {tab === 'inventory' && <button className="ad-btn-primary" onClick={() => { setEditingInventory(undefined); setShowInventoryForm(true); }}><I.plus width="14" height="14" />New equipment</button>}
            </>}
          />
          <Tabs items={[
            { label: 'Borrow Requests',     active: tab==='requests',  count: requests.length },
            { label: 'Inventory Management', active: tab==='inventory', count: inventory.length },
          ]} onTabChange={(l) => setTab(l === 'Borrow Requests' ? 'requests' : 'inventory')} />

          {/* ── Borrow Requests tab ── */}
          {tab === 'requests' && <>
            <Toolbar
              placeholder="Search requests by borrower, student ID, or item…"
              search={requestSearch} onSearch={setRequestSearch}
              onRefresh={fetchRequests}
              showSort={false}
            >
              <span className="ad-filter-label">Status</span>
              <select className="ad-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Status: All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="returned">Returned</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="ad-filter-label">Purpose</span>
              <select className="ad-filter-select" value={purposeFilter} onChange={e => setPurposeFilter(e.target.value)}>
                <option value="">Purpose: All</option>
                <option value="academic">Academic / Class Use</option>
                <option value="event">Event / Program</option>
                <option value="organization">Organization</option>
              </select>
              <span className="ad-filter-label">Sort</span>
              <select className="ad-filter-select" value={reqSort} onChange={e => setReqSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </Toolbar>
            <BulkBar count={selectedReq.length} actions={['Delete']} handlers={{ Delete: async () => { if (!selectedReq.length || !window.confirm(`Delete ${selectedReq.length} requests?`)) return; await axios.delete(`${API_URL}/borrowing/requests/delete`, { data: { ids: selectedReq }, withCredentials: true }); fetchRequests(); setSelectedReq([]); } }} onClear={() => setSelectedReq([])} />

            {requestsError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{requestsError}</p>}

            {requestsLoading ? (
              <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
            ) : (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup><col style={{width:44}}/><col style={{minWidth:240}}/><col style={{width:180}}/><col/><col style={{width:130}}/><col style={{width:130}}/><col style={{width:130}}/><col style={{width:160}}/></colgroup>
                  <thead><tr>
                    <th><input type="checkbox" checked={filteredReqs.length>0&&filteredReqs.every(r=>selectedReq.includes(r.id))} onChange={() => setSelectedReq(filteredReqs.every(r=>selectedReq.includes(r.id)) ? [] : filteredReqs.map(r=>r.id))} /></th>
                    <th>Borrower</th><th>Item</th><th>Purpose</th><th>Borrow date</th><th>Return date</th><th>Status</th><th className="ad-th-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredReqs.length === 0 && <tr><td colSpan={8}><div className="ad-empty"><p>No borrow requests.</p></div></td></tr>}
                    {filteredReqs.map(r => (
                      <tr key={r.id} className={`${selectedReq.includes(r.id)?'is-selected ':''} ${r.status==='pending'?'is-pinned':''}`}>
                        <td><input type="checkbox" checked={selectedReq.includes(r.id)} onChange={() => setSelectedReq(p => p.includes(r.id) ? p.filter(x=>x!==r.id) : [...p, r.id])} /></td>
                        <td>
                          <div className="ad-author">
                            <MiniAvatar name={r.borrower_name} />
                            <div className="ad-borrower-stack">
                              <span className="ad-borrower-name">{r.borrower_name}</span>
                              <span className="ad-borrower-meta"><span className="ad-mono">{r.borrower_id}</span>{r.organization ? ` · ${r.organization}` : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ad-item-cell">
                            <strong>{r.equipment_name}</strong>
                            <span className="ad-cell-muted">Qty {r.quantity_requested}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ad-title-stack">
                            <div className="ad-title-row">
                              {r.purpose_type && <span className={`ad-tag tone-${r.purpose_type==='academic'?'primary':'warning'}`}>{r.purpose_type}</span>}
                              {r.activity_name && <span className="ad-cell-text"><strong>{r.activity_name}</strong></span>}
                            </div>
                            <p className="ad-desc">{[r.venue, r.time_of_use, r.contact_number].filter(Boolean).join(' · ')}</p>
                          </div>
                        </td>
                        <td><span className="ad-date-abs">{fmtDate(r.borrow_date)}</span></td>
                        <td><span className="ad-date-abs">{fmtDate(r.return_date)}</span></td>
                        <td><StatusPill label={r.status} tone={BORROW_TONE[r.status] ?? 'neutral'} /></td>
                        <td className="ad-actions">
                          {r.status === 'pending' && <>
                            <button className="ad-icon-btn is-on" title="Approve" onClick={() => openConfirm('approve', r.id)}><I.check width="13" height="13" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Reject" onClick={() => openConfirm('reject', r.id)}><I.x width="14" height="14" /></button>
                          </>}
                          {r.status === 'approved' && (
                            <button className="ad-icon-btn" title="Mark returned" onClick={() => handleReturn(r.id)}><I.restore width="14" height="14" /></button>
                          )}
                          <button className="ad-icon-btn" title="View details" onClick={() => setViewRequest(r)}><I.eye width="14" height="14" /></button>
                          <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handleDeleteRequest(r.id)}><I.trash width="14" height="14" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredReqs.length}`} total={filteredReqs.length} label="requests" />
              </section>
            )}
          </>}

          {/* ── Inventory tab ── */}
          {tab === 'inventory' && <>
            <Toolbar
              placeholder="Search equipment by name…"
              search={inventorySearch} onSearch={setInventorySearch}
              showSort={false} onRefresh={fetchInventory}
            />

            {inventoryError && <p style={{fontSize:13,color:'var(--color-danger-text)'}}>{inventoryError}</p>}

            {(showInventoryForm || editingInventory) && (
              <InventoryForm
                initial={editingInventory}
                onSuccess={() => { setShowInventoryForm(false); setEditingInventory(undefined); fetchInventory(); }}
                onCancel={() => { setShowInventoryForm(false); setEditingInventory(undefined); }}
              />
            )}

            {inventoryLoading ? (
              <section className="ad-card"><div className="ad-empty"><p>Loading…</p></div></section>
            ) : (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup><col style={{width:44}}/><col style={{width:72}}/><col/><col style={{width:120}}/><col style={{width:120}}/><col style={{width:140}}/><col style={{width:160}}/></colgroup>
                  <thead><tr>
                    <th><input type="checkbox" /></th>
                    <th>Image</th><th>Equipment name</th><th>Available</th><th>Total</th><th>Status</th><th className="ad-th-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredInv.length === 0 && <tr><td colSpan={7}><div className="ad-empty"><p>No equipment found.</p></div></td></tr>}
                    {filteredInv.map(item => {
                      const { label, tone } = invStatus(item);
                      return (
                        <tr key={item.id} className={tone==='danger'?'is-pinned':''}>
                          <td><input type="checkbox" /></td>
                          <td><Thumb src={item.image ?? null} title={item.name} kind="object" /></td>
                          <td><a className="ad-title-link">{item.name}</a></td>
                          <td><span className={`ad-stock-num${item.quantity===0?' is-zero':''}`}>{item.quantity}</span></td>
                          <td><span className="ad-stock-num is-total">{item.max_quantity}</span></td>
                          <td><StatusPill label={label} tone={tone} /></td>
                          <td className="ad-actions">
                            <button className="ad-icon-btn" title="Edit" onClick={() => { setEditingInventory(item); setShowInventoryForm(false); }}><I.edit width="14" height="14" /></button>
                            <button className="ad-icon-btn ad-icon-btn--danger" title="Delete" onClick={() => handleDeleteInventory(item.id)}><I.trash width="14" height="14" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredInv.length}`} total={filteredInv.length} label="items" />
              </section>
            )}
          </>}
        </main>
      </div>

      {/* Confirm modal */}
      {confirmType && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,41,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:18,width:420,padding:'28px',boxShadow:'0 30px 80px -20px rgba(15,23,41,0.4)'}}>
            <h3 style={{margin:'0 0 12px',fontWeight:800,fontSize:17,color:'var(--color-text-primary)'}}>
              {confirmType === 'approve' ? 'Approve request?' : 'Reject request?'}
            </h3>
            <textarea
              placeholder="Admin notes (optional)…"
              value={confirmNotes}
              onChange={e => setConfirmNotes(e.target.value)}
              rows={3}
              style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--color-border)',borderRadius:10,fontFamily:'inherit',fontSize:13,resize:'vertical',marginBottom:14}}
            />
            {confirmError && <p style={{color:'var(--color-danger-text)',fontSize:13,marginBottom:12}}>{confirmError}</p>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="ad-btn-ghost" onClick={closeConfirm}>Cancel</button>
              <button
                className="ad-btn-primary"
                style={confirmType==='reject'?{background:'var(--color-danger-text)',borderColor:'var(--color-danger-text)'}:undefined}
                disabled={confirmSubmitting}
                onClick={handleConfirmAction}
              >
                {confirmSubmitting ? 'Processing…' : confirmType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View request detail modal */}
      {viewRequest && (
        <div className="ad-modal-overlay" onClick={() => setViewRequest(null)}>
          <div style={{background:'#fff',borderRadius:18,width:500,maxWidth:'92vw',padding:'28px',boxShadow:'0 30px 80px -20px rgba(15,23,41,0.4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{margin:0,fontWeight:800,fontSize:17,color:'var(--color-text-primary)'}}>Borrow Request Details</h3>
              <button style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--color-text-muted)'}} onClick={() => setViewRequest(null)}>×</button>
            </div>
            {([
              ['Equipment', viewRequest.equipment_name],
              ['Quantity', viewRequest.quantity_requested],
              ['Requester', viewRequest.borrower_name],
              ['Student No.', viewRequest.borrower_id],
              ['Email', viewRequest.borrower_email],
              ['Contact', viewRequest.contact_number],
              ['Organization', viewRequest.organization],
              ['Purpose', viewRequest.purpose_type],
              ['Activity', viewRequest.activity_name],
              ['Venue', viewRequest.venue],
              ['Time of Use', viewRequest.time_of_use],
              ['Date Needed', viewRequest.borrow_date],
              ['Return Date', viewRequest.return_date],
              ['Status', viewRequest.status],
            ] as [string, unknown][]).filter(([, v]) => v != null && v !== '').map(([label, value]) => (
              <div key={label} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:'1px solid var(--color-border-soft)'}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--color-text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:110,flexShrink:0}}>{label}</span>
                <span style={{fontSize:13,color:'var(--color-text-primary)'}}>{String(value)}</span>
              </div>
            ))}
            <div style={{marginTop:20,display:'flex',justifyContent:'flex-end'}}>
              <button className="ad-btn-ghost" onClick={() => setViewRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BorrowingPanel;
