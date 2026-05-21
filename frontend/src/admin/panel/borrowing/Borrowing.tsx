import { useState, useEffect, useCallback, useRef } from "react";
import "../_shared/admin-list.css";
import Sidebar from "../_shared/Sidebar";
import { PageHead, Tabs, Toolbar, TableFoot } from "../_shared/chrome";
import { StatusPill, Thumb } from "../_shared/atoms";
import { I } from "../_shared/icons";
import { fmtDate } from "../_shared/utils";
import axios from "axios";

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
  status: "pending" | "approved" | "rejected" | "returned";
  admin_notes?: string;
  created_at: string;
}

type AdminTab = "requests" | "inventory";
type ConfirmType = "approve" | "reject" | null;
type StatusTone = "primary" | "warning" | "danger" | "neutral" | "success";

function requestStatusTone(status: string): StatusTone {
  switch (status) {
    case "approved": return "success";
    case "pending": return "warning";
    case "rejected": return "danger";
    case "returned": return "neutral";
    default: return "neutral";
  }
}

// ── Inline inventory form ────────────────────────────────────────────────────

interface InventoryFormProps {
  initial?: InventoryItem;
  onSuccess: () => void;
  onCancel: () => void;
}

const InventoryForm = ({
  initial,
  onSuccess,
  onCancel,
}: InventoryFormProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [maxQty, setMaxQty] = useState(String(initial?.max_quantity ?? ""));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.image ?? null,
  );
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
      formData.append("name", name);
      formData.append("max_quantity", maxQty);
      if (imageFile) formData.append("image", imageFile);

      if (initial) {
        formData.append("id", initial.id);
        await axios.post(`${API_URL}/borrowing/inventory/edit`, formData, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/borrowing/inventory/add`, formData, {
          withCredentials: true,
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: 420,
        padding: "1rem",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        background: "var(--color-background)",
        marginBottom: "1rem",
      }}
    >
      <strong>{initial ? "Edit Equipment" : "Add Equipment"}</strong>
      {initial && (
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
          Note: changing total units does not affect currently borrowed quantities.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Equipment Image</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 120,
            height: 120,
            border: "2px dashed var(--color-border)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-hint)", textAlign: "center", padding: "0.5rem" }}>
              Click to upload
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        {imagePreview && (
          <button
            type="button"
            onClick={() => {
              setImageFile(null);
              setImagePreview(null);
            }}
            style={{
              fontSize: "0.75rem",
              color: "var(--color-danger)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              padding: 0,
            }}
          >
            Remove image
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 4 }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>Total Units *</label>
        <input
          type="number"
          min={1}
          value={maxQty}
          onChange={(e) => setMaxQty(e.target.value)}
          required
          style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--color-border)", borderRadius: 4 }}
        />
      </div>
      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.85rem", margin: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="ad-btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ad-btn-ghost"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Main panel ───────────────────────────────────────────────────────────────

const BorrowingPanel = () => {
  const [tab, setTab] = useState<AdminTab>("requests");

  // Requests tab state
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [requestSearch, setRequestSearch] = useState("");

  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Confirm modal state
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const [confirmRequestId, setConfirmRequestId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Inventory tab state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | undefined>(undefined);
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState("");

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const params = statusFilter !== "all" ? { params: { status: statusFilter } } : {};
      const { data } = await axios.get(`${API_URL}/borrowing/requests`, {
        withCredentials: true,
        ...params,
      });
      setRequests(data);
    } catch {
      setRequestsError("Failed to load borrow requests.");
    } finally {
      setRequestsLoading(false);
    }
  }, [statusFilter]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const { data } = await axios.get(`${API_URL}/borrowing/inventory`, {
        withCredentials: true,
      });
      setInventory(data);
    } catch {
      setInventoryError("Failed to load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openConfirm = (type: "approve" | "reject", requestId: string) => {
    setConfirmType(type);
    setConfirmRequestId(requestId);
    setConfirmNotes("");
    setConfirmError(null);
  };

  const closeConfirm = () => {
    setConfirmType(null);
    setConfirmRequestId(null);
    setConfirmNotes("");
    setConfirmError(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmType || !confirmRequestId) return;
    setConfirmSubmitting(true);
    setConfirmError(null);
    try {
      const endpoint =
        confirmType === "approve" ? "/borrowing/approve" : "/borrowing/reject";
      await axios.post(
        `${API_URL}${endpoint}`,
        {
          request_id: confirmRequestId,
          admin_notes: confirmNotes || undefined,
        },
        { withCredentials: true },
      );
      closeConfirm();
      fetchRequests();
      fetchInventory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Action failed.";
      setConfirmError(msg);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleReturn = async (requestId: string) => {
    try {
      await axios.post(
        `${API_URL}/borrowing/return`,
        { request_id: requestId },
        { withCredentials: true },
      );
      fetchRequests();
      fetchInventory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to mark as returned.";
      alert(msg);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Delete this borrow request? This cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/borrowing/requests/delete`, {
        data: { ids: [id] },
        withCredentials: true,
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete.";
      alert(msg);
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/borrowing/inventory/delete`, {
        data: { id },
        withCredentials: true,
      });
      setDeleteInvId(null);
      fetchInventory();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete.";
      alert(msg);
    }
  };

  const tabItems = [
    { label: "Requests", active: tab === "requests", count: requests.length },
    { label: "Inventory", active: tab === "inventory", count: inventory.length },
  ];

  const filteredRequests = requests.filter(
    (r) =>
      !requestSearch ||
      (r.borrower_name ?? "").toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.borrower_id ?? "").toLowerCase().includes(requestSearch.toLowerCase()),
  );

  const filteredInventory = inventory.filter(
    (item) =>
      !inventorySearch ||
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()),
  );

  return (
    <div className="ad-shell">
      <Sidebar active="borrowing" />
      <main className="ad-main">
        <PageHead
          title="Equipment"
          subtitle="Approve borrow requests and manage the CSG inventory. Borrowers can submit requests from the public Borrow page."
          actions={
            <>
              <button className="ad-btn-ghost" onClick={() => window.print()}>
                <I.print width="14" height="14" />
                Print
              </button>
            </>
          }
        />

        <Tabs
          items={tabItems}
          onTabChange={(label) => {
            if (label === "Requests") setTab("requests");
            else if (label === "Inventory") setTab("inventory");
          }}
        />

        {/* ── Requests Tab ── */}
        {tab === "requests" && (
          <>
            <Toolbar
              placeholder="Search requests by borrower, student ID, or item…"
              search={requestSearch}
              onSearch={setRequestSearch}
              onRefresh={fetchRequests}
              showSort={false}
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ad-filter-select"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="returned">Returned</option>
              </select>
            </Toolbar>

            {requestsLoading ? (
              <p style={{ padding: "1rem" }}>Loading requests...</p>
            ) : requestsError ? (
              <p style={{ padding: "0.5rem 1rem", color: "var(--color-danger)" }}>
                {requestsError}
              </p>
            ) : (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup>
                    <col style={{ minWidth: 200 }} />
                    <col style={{ width: 120 }} />
                    <col />
                    <col style={{ width: 60 }} />
                    <col style={{ width: 160 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 130 }} />
                    <col style={{ width: 160 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Student ID</th>
                      <th>Equipment</th>
                      <th>Qty</th>
                      <th>Purpose</th>
                      <th>Borrow date</th>
                      <th>Return date</th>
                      <th>Status</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => {
                      const isExpanded = expandedRequestId === r.id;
                      return (
                        <>
                          <tr
                            key={r.id}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setExpandedRequestId(isExpanded ? null : r.id)
                            }
                          >
                            <td>{r.borrower_name}</td>
                            <td><span className="ad-mono">{r.borrower_id}</span></td>
                            <td>{r.equipment_name}</td>
                            <td>{r.quantity_requested}</td>
                            <td>
                              <span className="ad-cell-text">{r.purpose_type || "—"}</span>
                            </td>
                            <td>
                              <span className="ad-date-abs">{fmtDate(r.borrow_date)}</span>
                            </td>
                            <td>
                              <span className="ad-date-abs">{fmtDate(r.return_date)}</span>
                            </td>
                            <td>
                              <StatusPill
                                label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                tone={requestStatusTone(r.status)}
                              />
                            </td>
                            <td className="ad-actions" onClick={(e) => e.stopPropagation()}>
                              {r.status === "pending" && (
                                <>
                                  <button
                                    className="ad-icon-btn is-on"
                                    title="Approve"
                                    onClick={() => openConfirm("approve", r.id)}
                                  >
                                    <I.check width="13" height="13" />
                                  </button>
                                  <button
                                    className="ad-icon-btn ad-icon-btn--danger"
                                    title="Reject"
                                    onClick={() => openConfirm("reject", r.id)}
                                  >
                                    <I.x width="14" height="14" />
                                  </button>
                                </>
                              )}
                              {r.status === "approved" && (
                                <button
                                  className="ad-icon-btn"
                                  title="Mark returned"
                                  onClick={() => handleReturn(r.id)}
                                  style={{ color: "var(--color-primary)" }}
                                >
                                  <I.restore width="14" height="14" />
                                </button>
                              )}
                              <button
                                className="ad-icon-btn ad-icon-btn--danger"
                                title="Delete request"
                                onClick={() => handleDeleteRequest(r.id)}
                              >
                                <I.trash width="15" height="15" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${r.id}-detail`}>
                              <td
                                colSpan={9}
                                style={{
                                  background: "var(--color-background)",
                                  padding: "0.75rem 1rem",
                                  borderTop: "1px solid var(--color-border)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                    gap: "0.5rem 1.5rem",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {r.organization && (
                                    <span>
                                      <strong>Organization:</strong> {r.organization}
                                    </span>
                                  )}
                                  {r.position_in_org && (
                                    <span>
                                      <strong>Position:</strong> {r.position_in_org}
                                    </span>
                                  )}
                                  {r.contact_number && (
                                    <span>
                                      <strong>Contact:</strong> {r.contact_number}
                                    </span>
                                  )}
                                  {r.purpose_type && (
                                    <span>
                                      <strong>Purpose Type:</strong> {r.purpose_type}
                                      {r.purpose_others_detail ? ` — ${r.purpose_others_detail}` : ""}
                                    </span>
                                  )}
                                  {r.activity_name && (
                                    <span>
                                      <strong>Activity:</strong> {r.activity_name}
                                    </span>
                                  )}
                                  {r.venue && (
                                    <span>
                                      <strong>Venue:</strong> {r.venue}
                                    </span>
                                  )}
                                  {r.time_of_use && (
                                    <span>
                                      <strong>Time of Use:</strong> {r.time_of_use}
                                    </span>
                                  )}
                                  {r.borrower_email && (
                                    <span>
                                      <strong>Email:</strong> {r.borrower_email}
                                    </span>
                                  )}
                                </div>
                                {r.equipment_items && r.equipment_items.length > 1 && (
                                  <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                                    <strong>All Equipment Items:</strong>
                                    <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                                      {r.equipment_items.map((item, i) => (
                                        <li key={i}>
                                          Qty {item.quantity_requested} — {item.equipment_id}
                                        </li>
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
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={9} className="ad-empty">No borrow requests yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredRequests.length}`} total={filteredRequests.length} label="requests" />
              </section>
            )}
          </>
        )}

        {/* ── Inventory Tab ── */}
        {tab === "inventory" && (
          <>
            <Toolbar
              placeholder="Search equipment by name…"
              search={inventorySearch}
              onSearch={setInventorySearch}
              onRefresh={fetchInventory}
              showSort={false}
            >
              <button
                className="ad-btn-primary"
                onClick={() => {
                  setEditingInventory(undefined);
                  setShowInventoryForm(true);
                }}
              >
                <I.plus width="14" height="14" />
                Add Equipment
              </button>
            </Toolbar>

            {showInventoryForm && (
              <div style={{ padding: "0 1rem 1rem" }}>
                <InventoryForm
                  initial={editingInventory}
                  onSuccess={() => {
                    setShowInventoryForm(false);
                    setEditingInventory(undefined);
                    fetchInventory();
                  }}
                  onCancel={() => {
                    setShowInventoryForm(false);
                    setEditingInventory(undefined);
                  }}
                />
              </div>
            )}

            {inventoryError && (
              <p style={{ padding: "0.5rem 1rem", color: "var(--color-danger)" }}>
                {inventoryError}
              </p>
            )}
            {inventoryLoading ? (
              <p style={{ padding: "1rem" }}>Loading...</p>
            ) : (
              <section className="ad-card">
                <table className="ad-table">
                  <colgroup>
                    <col style={{ width: 72 }} />
                    <col />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 140 }} />
                    <col style={{ width: 160 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Equipment name</th>
                      <th>Available</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="ad-th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className={!item.is_available ? "is-pinned" : ""}>
                        <td>
                          <Thumb
                            src={item.image ?? null}
                            title={item.name}
                            kind="object"
                          />
                        </td>
                        <td>
                          <span className="ad-title-link">{item.name}</span>
                        </td>
                        <td>
                          <span className={`ad-stock-num${item.quantity === 0 ? " is-zero" : ""}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>
                          <span className="ad-stock-num is-total">{item.max_quantity}</span>
                        </td>
                        <td>
                          <StatusPill
                            label={item.is_available ? "Available" : "Unavailable"}
                            tone={item.is_available ? "success" : "danger"}
                          />
                        </td>
                        <td className="ad-actions">
                          {deleteInvId === item.id ? (
                            <>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
                                Confirm delete?
                              </span>
                              <button
                                className="ad-btn-primary"
                                style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}
                                onClick={() => handleDeleteInventory(item.id)}
                              >
                                Yes
                              </button>
                              <button
                                className="ad-btn-ghost"
                                style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}
                                onClick={() => setDeleteInvId(null)}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="ad-icon-btn"
                                title="Edit"
                                onClick={() => {
                                  setEditingInventory(item);
                                  setShowInventoryForm(true);
                                }}
                              >
                                <I.edit width="14" height="14" />
                              </button>
                              <button
                                className="ad-icon-btn ad-icon-btn--danger"
                                title="Delete"
                                onClick={() => setDeleteInvId(item.id)}
                              >
                                <I.trash width="14" height="14" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="ad-empty">No equipment found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <TableFoot shown={`1–${filteredInventory.length}`} total={filteredInventory.length} label="items" />
              </section>
            )}
          </>
        )}

        {/* ── Confirm modal (approve / reject) ── */}
        {confirmType && (
          <div className="ad-modal-overlay" onClick={closeConfirm}>
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "1.5rem",
                maxWidth: 420,
                width: "90%",
                boxShadow: "0 30px 80px -20px rgba(15,23,41,0.40)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  {confirmType === "approve" ? "Approve Request" : "Reject Request"}
                </h3>
                <button className="ad-icon-btn" onClick={closeConfirm}>
                  <I.x width="16" height="16" />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {confirmType === "approve"
                    ? "Admin Notes (optional)"
                    : "Reason for Rejection"}
                </label>
                <textarea
                  rows={3}
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder={
                    confirmType === "approve"
                      ? "e.g. Approved — please pick up at the CSG office."
                      : "e.g. Equipment currently undergoing maintenance."
                  }
                  style={{
                    padding: "0.5rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
                {confirmError && (
                  <p style={{ color: "var(--color-danger)", fontSize: "0.85rem", margin: 0 }}>
                    {confirmError}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={handleConfirmAction}
                    disabled={confirmSubmitting}
                    className="ad-btn-primary"
                    style={confirmType === "reject"
                      ? { background: "var(--color-danger)", borderColor: "var(--color-danger)", flex: 1 }
                      : { flex: 1 }}
                  >
                    {confirmSubmitting
                      ? "Processing..."
                      : confirmType === "approve"
                        ? "Confirm Approve"
                        : "Confirm Reject"}
                  </button>
                  <button
                    onClick={closeConfirm}
                    className="ad-btn-ghost"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BorrowingPanel;
