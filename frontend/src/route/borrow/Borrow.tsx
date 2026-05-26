import { useEffect, useState } from "react";
import axios from "axios";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import "./borrow.css";

const API_URL = import.meta.env.VITE_API_URL as string;

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
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
  const [emailSent, setEmailSent] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [_selectedFromList, setSelectedFromList] =
    useState<InventoryItem | null>(null);

  // ── Section 1: Request Information ──
  const [requesterName, setRequesterName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
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
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // ── Equipment filter (list view) — must be at top level, not after early returns ──
  const [equipFilter, setEquipFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [equipSearch, setEquipSearch] = useState("");

  const FALLBACK_INVENTORY: InventoryItem[] = [
    {
      id: "9091ce6a-871d-4de2-9008-0cd84ae4fa54",
      name: "Basketball",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "dfa76261-a0f4-4436-959a-41f337cc4ded",
      name: "HDMI Cable",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "e6563dec-bfdb-446e-89d9-7f6f85ce2cee",
      name: "Iwata Fan",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "49cfe9bc-3a74-4aa1-89fd-a9ee316e2f6e",
      name: "Long Table",
      quantity: 2,
      max_quantity: 2,
      is_available: true,
    },
    {
      id: "d97a2657-81d1-4b17-83c3-b0361f79e748",
      name: "Microphone",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "44684f16-073d-4ab5-8ad2-8ef119f07fb4",
      name: "Mixer",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "1c49efaf-e579-40ab-ba8f-e489515761b3",
      name: "Orange Cones (for training)",
      quantity: 4,
      max_quantity: 4,
      is_available: true,
    },
    {
      id: "15061230-b28f-49f1-873b-d3a84fd4aa41",
      name: "Projector",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "78a6c8ba-00ad-48a3-8f73-6e41763c43f0",
      name: "Projector Screen",
      quantity: 2,
      max_quantity: 2,
      is_available: true,
    },
    {
      id: "ab83f5a8-9c30-46d8-9c88-8aae90e76928",
      name: "Soccer Ball",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
    {
      id: "90c3cb8c-9c0f-4898-8835-21a17c0632b8",
      name: "Speaker",
      quantity: 1,
      max_quantity: 1,
      is_available: true,
    },
  ];

  const fetchInventory = async () => {
    setLoadingInventory(true);
    setInventoryError(null);
    try {
      const { data } = await axios.get(`${API_URL}/equipment/`);
      setInventory(data);
    } catch {
      setInventory(FALLBACK_INVENTORY);
      setInventoryError(null);
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
  const updateRow = (
    index: number,
    field: keyof EquipmentRow,
    value: string | number,
  ) => {
    setEquipmentRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    if (equipmentRows.length >= 5) return;
    setEquipmentRows((prev) => [
      ...prev,
      { equipment_id: "", quantity_requested: 1 },
    ]);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requesterName.trim() || !studentNumber.trim() || !dateOfUse) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
      setSubmitError("Please enter a valid student email address.");
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
    if (!privacyConsent) {
      setSubmitError(
        "Please read and accept the Data Privacy Act consent before submitting.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data: result } = await axios.post<{ message: string; email_sent: boolean }>(
        `${API_URL}/borrowing/request`,
        {
          borrower_name: requesterName,
          borrower_id: studentNumber,
          borrower_email: studentEmail.trim(),
          student_email: studentEmail.trim(),
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
        },
      );
      setEmailSent(result?.email_sent ?? false);
      setView("success");
    } catch (err: unknown) {
      // Backend sends { error: "..." } — try both keys before falling back
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const msg = d?.error ?? d?.message ?? "Submission failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequesterName("");
    setStudentNumber("");
    setStudentEmail("");
    setContactNumber("");
    setOrganization("");
    setPositionInOrg("");
    setPurposeType("");
    setPurposeOthersDetail("");
    setActivityName("");
    setVenue("");
    setDateOfUse("");
    setTimeOfUse("");
    setEquipmentRows([{ equipment_id: "", quantity_requested: 1 }]);
    setSignature("");
    setPrivacyConsent(false);
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
          {emailSent ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-success, #16a34a)', marginTop: '0.5rem' }}>
              ✓ A confirmation email was sent to your email address.
            </p>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #6b7280)', marginTop: '0.5rem' }}>
              Note: We were unable to send a confirmation email. Your request
              was saved — please take note of your submission for reference.
            </p>
          )}
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
            <div className="borrow-section-title">
              Section 1 — Request Information
            </div>
            <div className="borrow-two-col">
              <div className="borrow-field">
                <label>Requester's Name *</label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="borrow-field">
                <label>Organization</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. CSG, CCS Student Council"
                />
              </div>
              <div className="borrow-field">
                <label>Student Number *</label>
                <input
                  type="text"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="e.g. 2021-00123"
                  required
                />
              </div>
              <div className="borrow-field">
                <label>Student Email *</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="your.email@cvsu.edu.ph"
                  required
                />
              </div>
              <div className="borrow-field">
                <label>Position</label>
                <input
                  type="text"
                  value={positionInOrg}
                  onChange={(e) => setPositionInOrg(e.target.value)}
                  placeholder="e.g. President, Member"
                />
              </div>
              <div className="borrow-field">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 09XX-XXX-XXXX"
                />
              </div>
              <div className="borrow-field">
                <label>Date of Request</label>
                <input type="date" value={todayStr()} readOnly />
              </div>
            </div>

            {/* ── Section 2: Event / Purpose Detail ── */}
            <div className="borrow-section-title">
              Section 2 — Event / Purpose Detail
            </div>
            <div className="borrow-two-col">
              {/* Left: Purpose checkboxes */}
              <div className="borrow-field" style={{ gridColumn: "1" }}>
                <label>Purpose of Equipment Use</label>
                <div
                  className="borrow-checkbox-group"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {(
                    [
                      "academic",
                      "event",
                      "organization",
                      "others",
                    ] as PurposeType[]
                  ).map((pt) => (
                    <div
                      key={pt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`purpose-${pt}`}
                        checked={purposeType === pt}
                        onChange={() =>
                          setPurposeType(purposeType === pt ? "" : pt)
                        }
                        style={{
                          width: "16px",
                          height: "16px",
                          flexShrink: 0,
                          margin: 0,
                        }}
                      />
                      <label
                        htmlFor={`purpose-${pt}`}
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          margin: 0,
                          cursor: "pointer",
                        }}
                      >
                        {pt === "academic" && "Academic / Class Use"}
                        {pt === "event" && "Event / Program"}
                        {pt === "organization" && "Organization"}
                        {pt === "others" && "Others:"}
                      </label>
                    </div>
                  ))}
                  {purposeType === "others" && (
                    <div
                      style={{
                        marginLeft: "1.625rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <input
                        type="text"
                        value={purposeOthersDetail}
                        onChange={(e) => setPurposeOthersDetail(e.target.value)}
                        placeholder="Please specify"
                        style={{
                          width: "100%",
                          maxWidth: "280px",
                          padding: "0.4rem 0.625rem",
                          fontSize: "0.85rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Event details */}
              <div className="borrow-field-group">
                <div className="borrow-field">
                  <label>Event / Activity Name</label>
                  <input
                    type="text"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="e.g. General Assembly"
                  />
                </div>
                <div className="borrow-field">
                  <label>Venue / Location</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. College Auditorium"
                  />
                </div>
                <div className="borrow-field">
                  <label>Date of Use *</label>
                  <input
                    type="date"
                    value={dateOfUse}
                    min={todayStr()}
                    onChange={(e) => setDateOfUse(e.target.value)}
                    required
                  />
                </div>
                <div className="borrow-field">
                  <label>Time of Use</label>
                  <input
                    type="text"
                    value={timeOfUse}
                    onChange={(e) => setTimeOfUse(e.target.value)}
                    placeholder="e.g. 10:00 AM – 12:00 PM"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 3: Equipment Requested ── */}
            <div className="borrow-section-title">
              Section 3 — Equipment Requested
            </div>
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
                        onChange={(e) =>
                          updateRow(
                            idx,
                            "quantity_requested",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="borrow-qty-input"
                      />
                    </td>
                    <td>
                      <select
                        value={row.equipment_id}
                        onChange={(e) =>
                          updateRow(idx, "equipment_id", e.target.value)
                        }
                        className="borrow-equip-select"
                        required
                      >
                        <option value="">— Select equipment —</option>
                        {inventory
                          .filter(
                            (i) => i.is_available || i.id === row.equipment_id,
                          )
                          .map((i) => (
                            <option
                              key={i.id}
                              value={i.id}
                              disabled={
                                !i.is_available && i.id !== row.equipment_id
                              }
                            >
                              {i.name} ({i.quantity} available)
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      {equipmentRows.length > 1 && (
                        <button
                          type="button"
                          className="borrow-remove-row"
                          onClick={() => removeRow(idx)}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {equipmentRows.length < 5 && (
              <button
                type="button"
                className="borrow-add-row-btn"
                onClick={addRow}
              >
                + Add Another Item
              </button>
            )}

            {/* ── Section 4: Acknowledgement ── */}
            <div className="borrow-section-title">
              Section 4 — Acknowledgement and Liability
            </div>
            <p className="borrow-disclaimer">
              I hereby certify that the above information is true and correct. I
              agree to use the requested equipment responsibly and to return all
              items in good condition. I understand that I may be held liable
              for any loss or damage.
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

            {/* ── Data Privacy Act Consent ── */}
            <div className="borrow-privacy-box">
              <p className="borrow-privacy-title">Data Privacy Act Consent</p>
              <p className="borrow-privacy-body">
                In compliance with Republic Act No. 10173 (Data Privacy Act of
                2012), the Central Student Government of Cavite State University
                – Imus Campus collects and processes your personal information
                (name, student number, email address, and contact number) solely
                for the purpose of processing your equipment borrow request.
                Your data will not be shared with third parties without your
                consent and will be retained only for the duration necessary to
                fulfill this purpose. You have the right to access, correct, or
                request deletion of your personal data at any time by contacting
                the CSG office.
              </p>
              <label className="borrow-privacy-check">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                />
                <span>
                  I have read and understood the Data Privacy Act consent above.
                  I voluntarily authorize the CSG to collect and use my personal
                  information for this equipment borrow request.{" "}
                  <strong>*</strong>
                </span>
              </label>
            </div>

            {submitError && <p className="borrow-error">{submitError}</p>}

            <button
              type="submit"
              className="borrow-btn-primary borrow-btn-full"
              disabled={submitting || !privacyConsent}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── List view (default) ──
  const visibleInventory = inventory.filter((item) => {
    if (equipFilter === "available" && !item.is_available) return false;
    if (equipFilter === "unavailable" && item.is_available) return false;
    if (
      equipSearch.trim() &&
      !item.name.toLowerCase().includes(equipSearch.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="eq-page">
      {/* Hero header */}
      <div className="eq-hero">
        <div className="eq-hero-inner">
          <span
            className="section-label"
            style={{
              display: "block",
              textAlign: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            CSG Resources
          </span>
          <h1 className="eq-hero-heading">
            <em className="italic-accent">Borrow</em> equipment
          </h1>
          <p className="eq-hero-sub">
            Borrow CSG-managed equipment for your org events, classes, or campus
            activities. Submit a request and we&rsquo;ll get back to you within
            24 hours.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bl-toolbar-wrap">
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            width: "100%",
            padding: "0 var(--section-padding-x)",
          }}
        >
          <SearchFilterBar
            searchValue={equipSearch}
            onSearchChange={setEquipSearch}
            showTermFilter={false}
            searchPlaceholder="Search equipment..."
          />
        </div>
      </div>

      {/* Inventory section */}
      <div className="eq-content">
        <div className="eq-inventory-header">
          <h2 className="eq-inventory-title">Equipment inventory</h2>
          {/* Filter pills — local state, no API call */}
          <div className="eq-filters">
            {(["all", "available", "unavailable"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`eq-pill${equipFilter === f ? " eq-pill-active" : ""}`}
                onClick={() => setEquipFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "available"
                    ? "Available"
                    : "Unavailable"}
              </button>
            ))}
          </div>
        </div>

        {loadingInventory && (
          <p className="borrow-loading">Loading equipment...</p>
        )}
        {inventoryError && <p className="borrow-error">{inventoryError}</p>}

        {!loadingInventory && !inventoryError && (
          <div className="eq-grid">
            {visibleInventory.map((item) => (
              <div key={item.id} className="eq-card card">
                {/* Status badge */}
                <span
                  className={`eq-status ${item.is_available ? "eq-status-ok" : "eq-status-out"}`}
                >
                  ● {item.is_available ? "AVAILABLE" : "OUT"}
                </span>

                {/* Image zone — CSG logo if no image */}
                <div className="eq-thumb">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="eq-thumb-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                        (
                          e.currentTarget.nextSibling as HTMLElement | null
                        )?.removeAttribute("style");
                      }}
                    />
                  ) : null}
                  {/* CSG logo fallback — always rendered, hidden when real image loads */}
                  <img
                    src="/CSG_logo.svg"
                    alt="CSG"
                    className="eq-thumb-logo"
                    style={item.image ? { display: "none" } : undefined}
                  />
                </div>

                {/* Card body */}
                <div className="eq-card-body">
                  <div className="eq-item-name">{item.name}</div>
                  <div className="eq-item-stock">
                    {item.quantity} of {item.max_quantity} in stock
                  </div>
                  <button
                    className={`btn ${item.is_available && item.quantity > 0 ? "btn-primary" : ""} eq-req-btn`}
                    disabled={!item.is_available || item.quantity === 0}
                    onClick={() =>
                      item.is_available &&
                      item.quantity > 0 &&
                      handleBorrowClick(item)
                    }
                    style={
                      !item.is_available || item.quantity === 0
                        ? {
                            background: "var(--color-border)",
                            color: "var(--color-text-muted)",
                            cursor: "not-allowed",
                          }
                        : undefined
                    }
                  >
                    {item.is_available && item.quantity > 0
                      ? "Request to Borrow"
                      : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
