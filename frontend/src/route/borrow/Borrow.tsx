import { useEffect, useState } from "react";
import axios from "axios";
import "./borrow.css";

const API_URL = import.meta.env.VITE_API_URL as string;

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
}

interface EquipmentRow {
  equipment_id: string;
  quantity_requested: number;
}

type View = "list" | "form" | "success";
type PurposeType = "academic" | "event" | "organization" | "others" | "";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function Borrow() {
  const [view, setView] = useState<View>("list");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedFromList, setSelectedFromList] = useState<InventoryItem | null>(null);

  // ── Section 1: Request Information ──
  const [requesterName, setRequesterName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [organization, setOrganization] = useState("");
  const [positionInOrg, setPositionInOrg] = useState("");

  // ── Section 2: Event / Purpose Detail ──
  const [purposeType, setPurposeType] = useState<PurposeType>("");
  const [purposeOthersDetail, setPurposeOthersDetail] = useState("");
  const [activityName, setActivityName] = useState("");
  const [venue, setVenue] = useState("");
  const [dateOfUse, setDateOfUse] = useState("");
  const [timeOfUse, setTimeOfUse] = useState("");

  // ── Section 3: Equipment Items ──
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([
    { equipment_id: "", quantity_requested: 1 },
  ]);

  // ── Section 4: Acknowledgement ──
  const [signature, setSignature] = useState("");

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoadingInventory(true);
    setInventoryError(null);
    try {
      const { data } = await axios.get(`${API_URL}/borrowing/inventory`);
      setInventory(data);
    } catch {
      setInventoryError("Failed to load equipment. Please try again.");
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleBorrowClick = (item: InventoryItem) => {
    setSelectedFromList(item);
    setEquipmentRows([{ equipment_id: item.id, quantity_requested: 1 }]);
    setSubmitError(null);
    setView("form");
  };

  // ── Equipment rows helpers ──
  const updateRow = (index: number, field: keyof EquipmentRow, value: string | number) => {
    setEquipmentRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    if (equipmentRows.length >= 5) return;
    setEquipmentRows((prev) => [...prev, { equipment_id: "", quantity_requested: 1 }]);
  };

  const removeRow = (index: number) => {
    setEquipmentRows((prev) => prev.filter((_, i) => i !== index));
  };

  const maxQtyForItem = (equipmentId: string) =>
    inventory.find((i) => i.id === equipmentId)?.quantity ?? 99;

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!requesterName.trim() || !studentNumber.trim() || !dateOfUse) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (equipmentRows.some((r) => !r.equipment_id)) {
      setSubmitError("Please select an equipment item for each row.");
      return;
    }
    if (!signature.trim()) {
      setSubmitError("Please provide your signature (typed name).");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/borrowing/request`, {
        borrower_name: requesterName,
        borrower_id: studentNumber,
        borrower_email: undefined,
        contact_number: contactNumber || undefined,
        organization: organization || undefined,
        position_in_org: positionInOrg || undefined,
        purpose_type: purposeType || undefined,
        purpose_others_detail: purposeOthersDetail || undefined,
        activity_name: activityName || undefined,
        venue: venue || undefined,
        borrow_date: dateOfUse,
        time_of_use: timeOfUse || undefined,
        equipment_items: equipmentRows.map((r) => ({
          equipment_id: r.equipment_id,
          quantity_requested: r.quantity_requested,
        })),
      });
      setView("success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequesterName(""); setStudentNumber(""); setContactNumber("");
    setOrganization(""); setPositionInOrg("");
    setPurposeType(""); setPurposeOthersDetail("");
    setActivityName(""); setVenue(""); setDateOfUse(""); setTimeOfUse("");
    setEquipmentRows([{ equipment_id: "", quantity_requested: 1 }]);
    setSignature("");
    setSelectedFromList(null);
    fetchInventory();
    setView("list");
  };

  // ── Success view ──
  if (view === "success") {
    return (
      <div className="borrow-page">
        <div className="borrow-success">
          <div className="borrow-success-icon">✓</div>
          <h2>Your equipment request has been submitted!</h2>
          <p>
            The CSG Property Manager will review your request. You will be
            contacted via your provided contact number or email.
          </p>
          <button className="borrow-btn-primary" onClick={resetForm}>
            Browse Equipment
          </button>
        </div>
      </div>
    );
  }

  // ── Form view ──
  if (view === "form") {
    return (
      <div className="borrow-page">
        <div className="borrow-form-wrapper">
          <button
            className="borrow-back-link"
            type="button"
            onClick={() => setView("list")}
          >
            ← Back to Equipment List
          </button>

          <h2 className="borrow-form-title">CSG Equipment Request Form</h2>

          <form className="borrow-form" onSubmit={handleSubmit}>

            {/* ── Section 1: Request Information ── */}
            <div className="borrow-section-title">Section 1 — Request Information</div>
            <div className="borrow-two-col">
              <div className="borrow-field">
                <label>Requester's Name *</label>
                <input type="text" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Full name" required />
              </div>
              <div className="borrow-field">
                <label>Organization</label>
                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. CSG, CCS Student Council" />
              </div>
              <div className="borrow-field">
                <label>Student Number *</label>
                <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="e.g. 2021-00123" required />
              </div>
              <div className="borrow-field">
                <label>Position</label>
                <input type="text" value={positionInOrg} onChange={(e) => setPositionInOrg(e.target.value)} placeholder="e.g. President, Member" />
              </div>
              <div className="borrow-field">
                <label>Contact Number</label>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g. 09XX-XXX-XXXX" />
              </div>
              <div className="borrow-field">
                <label>Date of Request</label>
                <input type="date" value={todayStr()} readOnly />
              </div>
            </div>

            {/* ── Section 2: Event / Purpose Detail ── */}
            <div className="borrow-section-title">Section 2 — Event / Purpose Detail</div>
            <div className="borrow-two-col">
              {/* Left: Purpose checkboxes */}
              <div className="borrow-field">
                <label>Purpose of Equipment Use</label>
                <div className="borrow-checkbox-group">
                  {(["academic", "event", "organization", "others"] as PurposeType[]).map((pt) => (
                    <label key={pt} className="borrow-checkbox-label">
                      <input
                        type="checkbox"
                        checked={purposeType === pt}
                        onChange={() => setPurposeType(purposeType === pt ? "" : pt)}
                      />
                      {pt === "academic" && "Academic / Class Use"}
                      {pt === "event" && "Event / Program"}
                      {pt === "organization" && "Organization"}
                      {pt === "others" && "Others:"}
                    </label>
                  ))}
                  {purposeType === "others" && (
                    <input
                      type="text"
                      value={purposeOthersDetail}
                      onChange={(e) => setPurposeOthersDetail(e.target.value)}
                      placeholder="Please specify"
                      className="borrow-others-input"
                    />
                  )}
                </div>
              </div>

              {/* Right: Event details */}
              <div className="borrow-field-group">
                <div className="borrow-field">
                  <label>Event / Activity Name</label>
                  <input type="text" value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="e.g. General Assembly" />
                </div>
                <div className="borrow-field">
                  <label>Venue / Location</label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. College Auditorium" />
                </div>
                <div className="borrow-field">
                  <label>Date of Use *</label>
                  <input type="date" value={dateOfUse} min={todayStr()} onChange={(e) => setDateOfUse(e.target.value)} required />
                </div>
                <div className="borrow-field">
                  <label>Time of Use</label>
                  <input type="text" value={timeOfUse} onChange={(e) => setTimeOfUse(e.target.value)} placeholder="e.g. 10:00 AM – 12:00 PM" />
                </div>
              </div>
            </div>

            {/* ── Section 3: Equipment Requested ── */}
            <div className="borrow-section-title">Section 3 — Equipment Requested</div>
            <table className="borrow-equipment-table">
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Equipment Name</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {equipmentRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={maxQtyForItem(row.equipment_id)}
                        value={row.quantity_requested}
                        onChange={(e) => updateRow(idx, "quantity_requested", parseInt(e.target.value) || 1)}
                        className="borrow-qty-input"
                      />
                    </td>
                    <td>
                      <select
                        value={row.equipment_id}
                        onChange={(e) => updateRow(idx, "equipment_id", e.target.value)}
                        className="borrow-equip-select"
                        required
                      >
                        <option value="">— Select equipment —</option>
                        {inventory.filter((i) => i.is_available || i.id === row.equipment_id).map((i) => (
                          <option key={i.id} value={i.id} disabled={!i.is_available && i.id !== row.equipment_id}>
                            {i.name} ({i.quantity} available)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {equipmentRows.length > 1 && (
                        <button type="button" className="borrow-remove-row" onClick={() => removeRow(idx)}>×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {equipmentRows.length < 5 && (
              <button type="button" className="borrow-add-row-btn" onClick={addRow}>
                + Add Another Item
              </button>
            )}

            {/* ── Section 4: Acknowledgement ── */}
            <div className="borrow-section-title">Section 4 — Acknowledgement and Liability</div>
            <p className="borrow-disclaimer">
              I hereby certify that the above information is true and correct. I agree to use
              the requested equipment responsibly and to return all items in good condition.
              I understand that I may be held liable for any loss or damage.
            </p>
            <div className="borrow-two-col">
              <div className="borrow-field">
                <label>Requester's Signature (typed name) *</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name as signature"
                  required
                />
              </div>
              <div className="borrow-field">
                <label>Date Signed</label>
                <input type="date" value={todayStr()} readOnly />
              </div>
            </div>

            {submitError && <p className="borrow-error">{submitError}</p>}

            <button type="submit" className="borrow-btn-primary borrow-btn-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── List view (default) ──
  return (
    <div className="borrow-page">
      <div className="borrow-header">
        <h1>Equipment</h1>
        <p>Browse available CSG equipment and submit a borrow request.</p>
      </div>

      {loadingInventory && <p className="borrow-loading">Loading equipment...</p>}
      {inventoryError && <p className="borrow-error">{inventoryError}</p>}

      {!loadingInventory && !inventoryError && (
        <div className="borrow-grid">
          {inventory.map((item) => (
            <div key={item.id} className="borrow-card">
              <div className="borrow-card-name">{item.name}</div>
              <div className="borrow-card-qty">
                {item.quantity} / {item.max_quantity} units available
              </div>
              <span className={`borrow-badge ${item.is_available ? "borrow-badge-available" : "borrow-badge-unavailable"}`}>
                {item.is_available ? "Available" : "Unavailable"}
              </span>
              <button
                className="borrow-btn-primary"
                disabled={!item.is_available || item.quantity === 0}
                onClick={() => handleBorrowClick(item)}
              >
                {item.is_available ? "Request to Borrow" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
