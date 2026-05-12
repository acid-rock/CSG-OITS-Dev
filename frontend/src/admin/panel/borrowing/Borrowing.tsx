import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
}

interface EquipmentItem {
  equipment_id: string;
  quantity_requested: number;
}

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

const statusColor: Record<string, string> = {
  pending:  '#f59e0b',
  approved: '#16a34a',
  rejected: '#dc2626',
  returned: '#6b7280',
};

const fmt = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Inline inventory form ────────────────────────────────────────────────────

interface InventoryFormProps {
  initial?: InventoryItem;
  onSuccess: () => void;
  onCancel: () => void;
}

const InventoryForm = ({ initial, onSuccess, onCancel }: InventoryFormProps) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [maxQty, setMaxQty] = useState(String(initial?.max_quantity ?? ''));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('max_quantity', maxQty);
      if (imageFile) formData.append('image', imageFile);

      if (initial) {
        formData.append('id', initial.id);
        await axios.post(`${API_URL}/borrowing/inventory/edit`, formData, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/borrowing/inventory/add`, formData, { withCredentials: true });
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 420, padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', marginBottom: '1rem' }}>
      <strong>{initial ? 'Edit Equipment' : 'Add Equipment'}</strong>
      {initial && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
          Note: changing total units does not affect currently borrowed quantities.
        </p>
      )}

      {/* Image upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Equipment Image</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 120, height: 120, border: '2px dashed #d1d5db', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', background: '#fff', flexShrink: 0,
          }}
        >
          {imagePreview
            ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '0.5rem' }}>Click to upload</span>
          }
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
        {imagePreview && (
          <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
            style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            Remove image
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Name *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
          style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Total Units *</label>
        <input type="number" min={1} value={maxQty} onChange={(e) => setMaxQty(e.target.value)} required
          style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4 }} />
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="announce-add-btn" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ padding: '0.3rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
};

// ── Main panel ───────────────────────────────────────────────────────────────

const BorrowingPanel = () => {
  const [tab, setTab] = useState<AdminTab>('requests');

  // Requests tab state
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestSearch, setRequestSearch] = useState('');

  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Confirm modal state
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const [confirmRequestId, setConfirmRequestId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Inventory tab state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | undefined>(undefined);
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const params = statusFilter !== 'all' ? { params: { status: statusFilter } } : {};
      const { data } = await axios.get(`${API_URL}/borrowing/requests`, { withCredentials: true, ...params });
      setRequests(data);
    } catch {
      setRequestsError('Failed to load borrow requests.');
    } finally {
      setRequestsLoading(false);
    }
  }, [statusFilter]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const { data } = await axios.get(`${API_URL}/borrowing/inventory`, { withCredentials: true });
      setInventory(data);
    } catch {
      setInventoryError('Failed to load inventory.');
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openConfirm = (type: 'approve' | 'reject', requestId: string) => {
    setConfirmType(type);
    setConfirmRequestId(requestId);
    setConfirmNotes('');
    setConfirmError(null);
  };

  const closeConfirm = () => {
    setConfirmType(null);
    setConfirmRequestId(null);
    setConfirmNotes('');
    setConfirmError(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmType || !confirmRequestId) return;
    setConfirmSubmitting(true);
    setConfirmError(null);
    try {
      const endpoint = confirmType === 'approve' ? '/borrowing/approve' : '/borrowing/reject';
      await axios.post(`${API_URL}${endpoint}`, { request_id: confirmRequestId, admin_notes: confirmNotes || undefined }, { withCredentials: true });
      closeConfirm();
      fetchRequests();
      fetchInventory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.';
      setConfirmError(msg);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleReturn = async (requestId: string) => {
    try {
      await axios.post(`${API_URL}/borrowing/return`, { request_id: requestId }, { withCredentials: true });
      fetchRequests();
      fetchInventory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to mark as returned.';
      alert(msg);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Delete this borrow request? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/borrowing/requests/delete`, { data: { ids: [id] }, withCredentials: true });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.';
      alert(msg);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/borrowing/inventory/delete`, { data: { id }, withCredentials: true });
      setDeleteInvId(null);
      fetchInventory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.';
      alert(msg);
    }
  };

  const tabStyle = (t: AdminTab) => ({
    padding: '0.35rem 1rem',
    border: 'none',
    borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#3b82f6' : '#6b7280',
    fontSize: '0.9rem',
  });

  return (
    <div className="announce-container">
      <div className="announce-header"><span>Equipment</span></div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '0.75rem' }}>
        <button style={tabStyle('requests')} onClick={() => setTab('requests')}>Borrow Requests</button>
        <button style={tabStyle('inventory')} onClick={() => setTab('inventory')}>Inventory Management</button>
      </div>

      {/* ── Requests Tab ── */}
      {tab === 'requests' && (
        <>
          <div className="announce-toolbar">
            <span className="announce-file-count">{requests.length} Requests</span>
            <input
              type="text"
              placeholder="Search requests..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              style={{ flex: 1, padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', minWidth: 0 }}
            />
            <div className="announce-toolbar-actions">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          {requestsLoading ? (
            <p style={{ padding: '1rem' }}>Loading requests...</p>
          ) : requestsError ? (
            <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{requestsError}</p>
          ) : (
            <div className="announce-file-table">
              <table>
                <thead>
                  <tr className="announce-table-header-light">
                    <th>Borrower</th>
                    <th>Student ID</th>
                    <th>Equipment</th>
                    <th>Qty</th>
                    <th>Purpose</th>
                    <th>Borrow Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter((r) => !requestSearch || (r.borrower_name ?? '').toLowerCase().includes(requestSearch.toLowerCase()) || (r.borrower_id ?? '').toLowerCase().includes(requestSearch.toLowerCase())).map((r) => {
                    const isExpanded = expandedRequestId === r.id;
                    return (
                      <>
                        <tr
                          key={r.id}
                          className="announce-table-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedRequestId(isExpanded ? null : r.id)}
                        >
                          <td>{r.borrower_name}</td>
                          <td>{r.borrower_id}</td>
                          <td>{r.equipment_name}</td>
                          <td>{r.quantity_requested}</td>
                          <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose_type || '—'}</td>
                          <td>{fmt(r.borrow_date)}</td>
                          <td>{fmt(r.return_date)}</td>
                          <td>
                            <span style={{ fontWeight: 600, color: statusColor[r.status], fontSize: '0.8rem', textTransform: 'capitalize' }}>
                              {r.status}
                            </span>
                          </td>
                          <td className="announce-file-btn" onClick={(e) => e.stopPropagation()}>
                            <div className="announce-file-btn-inner">
                              <button
                                title='Delete request'
                                onClick={() => handleDeleteRequest(r.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={15} />
                              </button>
                              {r.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openConfirm('approve', r.id)}
                                    style={{ padding: '0.2rem 0.5rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openConfirm('reject', r.id)}
                                    style={{ padding: '0.2rem 0.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {r.status === 'approved' && (
                                <button
                                  onClick={() => handleReturn(r.id)}
                                  style={{ padding: '0.2rem 0.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Mark Returned
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${r.id}-detail`}>
                            <td colSpan={9} style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
                                {r.organization && <span><strong>Organization:</strong> {r.organization}</span>}
                                {r.position_in_org && <span><strong>Position:</strong> {r.position_in_org}</span>}
                                {r.contact_number && <span><strong>Contact:</strong> {r.contact_number}</span>}
                                {r.purpose_type && <span><strong>Purpose Type:</strong> {r.purpose_type}{r.purpose_others_detail ? ` — ${r.purpose_others_detail}` : ''}</span>}
                                {r.activity_name && <span><strong>Activity:</strong> {r.activity_name}</span>}
                                {r.venue && <span><strong>Venue:</strong> {r.venue}</span>}
                                {r.time_of_use && <span><strong>Time of Use:</strong> {r.time_of_use}</span>}
                                {r.borrower_email && <span><strong>Email:</strong> {r.borrower_email}</span>}
                              </div>
                              {r.equipment_items && r.equipment_items.length > 1 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                  <strong>All Equipment Items:</strong>
                                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                                    {r.equipment_items.map((item, i) => (
                                      <li key={i}>Qty {item.quantity_requested} — {item.equipment_id}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No borrow requests yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Inventory Tab ── */}
      {tab === 'inventory' && (
        <>
          <div className="announce-toolbar">
            <span className="announce-file-count">{inventory.length} Items</span>
            <input
              type="text"
              placeholder="Search equipment..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              style={{ flex: 1, padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.875rem', minWidth: 0 }}
            />
            <div className="announce-toolbar-actions">
              <button
                className="announce-add-btn"
                onClick={() => { setEditingInventory(undefined); setShowInventoryForm(true); }}
              >
                Add Equipment
              </button>
            </div>
          </div>

          {showInventoryForm && (
            <div style={{ padding: '0 1rem' }}>
              <InventoryForm
                initial={editingInventory}
                onSuccess={() => { setShowInventoryForm(false); setEditingInventory(undefined); fetchInventory(); }}
                onCancel={() => { setShowInventoryForm(false); setEditingInventory(undefined); }}
              />
            </div>
          )}

          {inventoryError && <p style={{ padding: '0.5rem 1rem', color: 'red' }}>{inventoryError}</p>}
          {inventoryLoading ? (
            <p style={{ padding: '1rem' }}>Loading...</p>
          ) : (
            <div className="announce-file-table">
              <table>
                <thead>
                  <tr className="announce-table-header-light">
                    <th style={{ width: 60 }}>Image</th>
                    <th>Equipment Name</th>
                    <th>Available</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter((item) => !inventorySearch || item.name.toLowerCase().includes(inventorySearch.toLowerCase())).map((item) => (
                    <tr key={item.id} className="announce-table-row">
                      <td>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                          : <div style={{ width: 40, height: 40, background: '#f3f4f6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#9ca3af' }}>No img</div>
                        }
                      </td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.max_quantity}</td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: item.is_available ? '#16a34a' : '#dc2626' }}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="announce-file-btn">
                        <div className="announce-file-btn-inner">
                          {deleteInvId === item.id ? (
                            <>
                              <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Confirm delete?</span>
                              <button onClick={() => handleDeleteInventory(item.id)}
                                style={{ padding: '0.15rem 0.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                                Yes
                              </button>
                              <button onClick={() => setDeleteInvId(null)}
                                style={{ padding: '0.15rem 0.5rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <img src="/bin.png" alt="Delete" onClick={() => setDeleteInvId(item.id)} style={{ cursor: 'pointer' }} />
                              <img src="/edit.png" alt="Edit" onClick={() => { setEditingInventory(item); setShowInventoryForm(true); }} style={{ cursor: 'pointer' }} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No equipment found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Confirm modal (approve / reject) ── */}
      {confirmType && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={closeConfirm}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 400, width: '90%', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.75rem', textTransform: 'capitalize' }}>
              {confirmType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {confirmType === 'approve' ? 'Admin Notes (optional)' : 'Reason for Rejection'}
              </label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder={confirmType === 'approve' ? 'e.g. Approved — please pick up at the CSG office.' : 'e.g. Equipment currently undergoing maintenance.'}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.875rem', resize: 'vertical' }}
              />
            </div>
            {confirmError && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{confirmError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={handleConfirmAction}
                disabled={confirmSubmitting}
                style={{ flex: 1, padding: '0.5rem', background: confirmType === 'approve' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
              >
                {confirmSubmitting ? 'Processing...' : confirmType === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
              <button onClick={closeConfirm}
                style={{ flex: 1, padding: '0.5rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingPanel;
