import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReservationCalendar, { type DateStatus } from '../../components/reservation-calendar/ReservationCalendar';
import './borrow-reservation.css';

const API_URL = import.meta.env.VITE_API_URL as string;

/* ── Interfaces ─────────────────────────────────────────────────────────────── */

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
}

interface AvailabilityEntry {
  borrow_date: string;   // 'YYYY-MM-DD'
  return_date: string;   // 'YYYY-MM-DD'
  status: 'pending' | 'approved';
  quantity_requested: number;
}

type PurposeType = 'academic' | 'event' | 'organization' | 'others' | '';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const todayStr = () => new Date().toISOString().split('T')[0];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ── Availability status logic ───────────────────────────────────────────────── */

function computeDateStatus(
  dateStr: string,
  availability: AvailabilityEntry[],
  maxQty: number,
): DateStatus {
  if (dateStr < todayStr()) return 'past';
  const reserved = availability
    .filter((r) => r.borrow_date <= dateStr && dateStr <= r.return_date)
    .reduce((sum, r) => sum + r.quantity_requested, 0);
  if (reserved === 0) return 'available';
  if (reserved < maxQty) return 'partial';
  return 'full';
}

/* ── Page component ──────────────────────────────────────────────────────────── */

export default function BorrowReservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* Equipment + availability */
  const [equipment, setEquipment] = useState<InventoryItem | null>(null);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loadingEquip, setLoadingEquip] = useState(true);
  const [equipError, setEquipError] = useState<string | null>(null);

  /* Calendar navigation */
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  /* Selected reservation date */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* Return date (user picks it) */
  const [returnDate, setReturnDate] = useState('');

  /* Form fields */
  const [requesterName, setRequesterName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [positionInOrg, setPositionInOrg] = useState('');
  const [purposeType, setPurposeType] = useState<PurposeType>('');
  const [purposeOthersDetail, setPurposeOthersDetail] = useState('');
  const [activityName, setActivityName] = useState('');
  const [venue, setVenue] = useState('');
  const [timeOfUse, setTimeOfUse] = useState('');
  const [signature, setSignature] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [quantityRequested, setQuantityRequested] = useState(1);

  /* Submit state */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [step, setStep] = useState<'reserve' | 'success'>('reserve');

  /* ── Fetch data ────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!id) return;
    setLoadingEquip(true);
    setEquipError(null);

    Promise.all([
      axios.get<InventoryItem>(`${API_URL}/borrowing/inventory/${id}`),
      axios.get<AvailabilityEntry[]>(`${API_URL}/borrowing/availability/${id}`),
    ])
      .then(([equipRes, availRes]) => {
        setEquipment(equipRes.data);
        setAvailability(availRes.data);
      })
      .catch(() => {
        setEquipError('Could not load equipment details. Please go back and try again.');
      })
      .finally(() => setLoadingEquip(false));
  }, [id]);

  /* Reset return date when borrow date changes */
  useEffect(() => {
    if (selectedDate) {
      setReturnDate(addDays(selectedDate, 1));
    } else {
      setReturnDate('');
    }
  }, [selectedDate]);

  /* ── Date status helper ──────────────────────────────────────────────────────── */

  const getDateStatus = (dateStr: string): DateStatus =>
    computeDateStatus(dateStr, availability, equipment?.max_quantity ?? 1);

  /* ── Submit ──────────────────────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedDate) {
      setSubmitError('Please select a reservation date on the calendar.');
      return;
    }
    if (!returnDate || returnDate <= selectedDate) {
      setSubmitError('Return date must be after the borrow date.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requesterName.trim() || !studentNumber.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
      setSubmitError('Please enter a valid student email address.');
      return;
    }
    if (!signature.trim()) {
      setSubmitError('Please provide your signature (typed name).');
      return;
    }
    if (!privacyConsent) {
      setSubmitError('Please read and accept the Data Privacy Act consent before submitting.');
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
          borrow_date: selectedDate,
          return_date: returnDate,
          time_of_use: timeOfUse || undefined,
          equipment_items: [
            { equipment_id: id, quantity_requested: quantityRequested },
          ],
        },
      );
      setEmailSent(result?.email_sent ?? false);
      setStep('success');
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      const msg = d?.error ?? d?.message ?? 'Submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ──────────────────────────────────────────────────────────── */

  if (step === 'success') {
    return (
      <div className="br-page">
        <div className="br-success">
          <div className="br-success-icon">✓</div>
          <h2>Reservation submitted!</h2>
          <p>
            Your reservation for <strong>{equipment?.name ?? 'equipment'}</strong> on{' '}
            <strong>{formatDisplayDate(selectedDate!)}</strong> has been received.
          </p>
          <p>The CSG Property Manager will review your request and contact you via email or phone.</p>
          {emailSent ? (
            <p className="br-success-email br-success-email--ok">
              ✓ A confirmation email was sent to your email address.
            </p>
          ) : (
            <p className="br-success-email br-success-email--warn">
              Note: We were unable to send a confirmation email. Your request was saved — please
              take note of your submission for reference.
            </p>
          )}
          <div className="br-success-actions">
            <button className="br-btn-primary" onClick={() => navigate('/borrow')}>
              Back to Equipment List
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading / error states ──────────────────────────────────────────────────── */

  if (loadingEquip) {
    return (
      <div className="br-page">
        <div className="br-loading">Loading equipment details…</div>
      </div>
    );
  }

  if (equipError || !equipment) {
    return (
      <div className="br-page">
        <div className="br-error">
          <p>{equipError ?? 'Equipment not found.'}</p>
          <button className="br-btn-ghost" onClick={() => navigate('/borrow')}>
            ← Back to Equipment List
          </button>
        </div>
      </div>
    );
  }

  const reservedOnSelected = selectedDate
    ? availability
        .filter((r) => r.borrow_date <= selectedDate && selectedDate <= r.return_date)
        .reduce((s, r) => s + r.quantity_requested, 0)
    : 0;
  const maxAllowed = equipment.max_quantity - reservedOnSelected;

  /* ── Main reserve view ──────────────────────────────────────────────────────── */

  return (
    <div className="br-page">
      {/* Back link */}
      <button className="br-back-link" type="button" onClick={() => navigate('/borrow')}>
        ← Back to Equipment List
      </button>

      {/* Equipment header */}
      <div className="br-equip-header">
        <div className="br-equip-thumb">
          {equipment.image ? (
            <img src={equipment.image} alt={equipment.name} />
          ) : (
            <img src="/CSG_logo.svg" alt="CSG" className="br-equip-logo" />
          )}
        </div>
        <div className="br-equip-info">
          <h1 className="br-equip-name">{equipment.name}</h1>
          <div className="br-equip-meta">
            <span
              className={`br-equip-badge ${equipment.is_available && equipment.quantity > 0 ? 'br-equip-badge--ok' : 'br-equip-badge--out'}`}
            >
              {equipment.is_available && equipment.quantity > 0
                ? `${equipment.quantity} of ${equipment.max_quantity} available`
                : 'Out of stock'}
            </span>
          </div>
          <p className="br-equip-hint">
            Select a date on the calendar to see availability and complete your reservation.
          </p>
        </div>
      </div>

      <div className="br-body">
        {/* ── Calendar panel ── */}
        <div className="br-cal-panel">
          <h2 className="br-section-title">Step 1 — Choose a date</h2>
          <ReservationCalendar
            year={calYear}
            month={calMonth}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
            variant="user"
            getDateStatus={getDateStatus}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSubmitError(null);
            }}
          />

          {selectedDate && (
            <div className="br-date-confirm">
              <span className="br-date-confirm-label">Selected date:</span>
              <span className="br-date-confirm-value">{formatDisplayDate(selectedDate)}</span>
              <button
                type="button"
                className="br-date-clear"
                onClick={() => setSelectedDate(null)}
                aria-label="Clear selected date"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* ── Form panel (visible once date is selected) ── */}
        {selectedDate && (
          <div className="br-form-panel">
            <h2 className="br-section-title">Step 2 — Complete your reservation</h2>

            <form className="br-form" onSubmit={handleSubmit}>
              {/* Reservation summary chips */}
              <div className="br-summary-chips">
                <span className="br-chip br-chip--equip">{equipment.name}</span>
                <span className="br-chip br-chip--date">{selectedDate}</span>
              </div>

              {/* Section 1: Request Information */}
              <div className="br-section-label">Section 1 — Request Information</div>
              <div className="br-two-col">
                <div className="br-field">
                  <label>Requester's Name <span className="br-req">*</span></label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="br-field">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. CSG, CCS Student Council"
                  />
                </div>
                <div className="br-field">
                  <label>Student Number <span className="br-req">*</span></label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="e.g. 2021-00123"
                    required
                  />
                </div>
                <div className="br-field">
                  <label>Student Email <span className="br-req">*</span></label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="your.email@cvsu.edu.ph"
                    required
                  />
                </div>
                <div className="br-field">
                  <label>Position</label>
                  <input
                    type="text"
                    value={positionInOrg}
                    onChange={(e) => setPositionInOrg(e.target.value)}
                    placeholder="e.g. President, Member"
                  />
                </div>
                <div className="br-field">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 09XX-XXX-XXXX"
                  />
                </div>
                <div className="br-field">
                  <label>Date of Request</label>
                  <input type="date" value={todayStr()} readOnly />
                </div>
              </div>

              {/* Section 2: Event / Purpose Detail */}
              <div className="br-section-label">Section 2 — Event / Purpose Detail</div>
              <div className="br-two-col">
                <div className="br-field" style={{ gridColumn: '1' }}>
                  <label>Purpose of Equipment Use</label>
                  <div className="br-checkbox-group">
                    {(['academic', 'event', 'organization', 'others'] as PurposeType[]).map((pt) => (
                      <label key={pt} className="br-checkbox-row">
                        <input
                          type="checkbox"
                          checked={purposeType === pt}
                          onChange={() => setPurposeType(purposeType === pt ? '' : pt)}
                        />
                        <span>
                          {pt === 'academic' && 'Academic / Class Use'}
                          {pt === 'event' && 'Event / Program'}
                          {pt === 'organization' && 'Organization'}
                          {pt === 'others' && 'Others:'}
                        </span>
                      </label>
                    ))}
                    {purposeType === 'others' && (
                      <input
                        type="text"
                        value={purposeOthersDetail}
                        onChange={(e) => setPurposeOthersDetail(e.target.value)}
                        placeholder="Please specify"
                        className="br-others-input"
                      />
                    )}
                  </div>
                </div>
                <div className="br-field-group">
                  <div className="br-field">
                    <label>Event / Activity Name</label>
                    <input
                      type="text"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      placeholder="e.g. General Assembly"
                    />
                  </div>
                  <div className="br-field">
                    <label>Venue / Location</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. College Auditorium"
                    />
                  </div>
                  <div className="br-field">
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

              {/* Section 3: Equipment / Dates */}
              <div className="br-section-label">Section 3 — Equipment &amp; Dates</div>
              <div className="br-two-col">
                <div className="br-field">
                  <label>Equipment</label>
                  <input type="text" value={equipment.name} readOnly className="br-readonly" />
                </div>
                <div className="br-field">
                  <label>Quantity <span className="br-req">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={maxAllowed > 0 ? maxAllowed : 1}
                    value={quantityRequested}
                    onChange={(e) =>
                      setQuantityRequested(
                        Math.min(parseInt(e.target.value) || 1, maxAllowed > 0 ? maxAllowed : 1),
                      )
                    }
                  />
                </div>
                <div className="br-field">
                  <label>Borrow Date</label>
                  <input type="date" value={selectedDate} readOnly className="br-readonly" />
                </div>
                <div className="br-field">
                  <label>Return Date <span className="br-req">*</span></label>
                  <input
                    type="date"
                    value={returnDate}
                    min={addDays(selectedDate, 1)}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Section 4: Acknowledgement */}
              <div className="br-section-label">Section 4 — Acknowledgement and Liability</div>
              <p className="br-disclaimer">
                I hereby certify that the above information is true and correct. I agree to use the
                requested equipment responsibly and to return all items in good condition. I
                understand that I may be held liable for any loss or damage.
              </p>
              <div className="br-two-col">
                <div className="br-field">
                  <label>Requester's Signature (typed name) <span className="br-req">*</span></label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name as signature"
                    required
                  />
                </div>
                <div className="br-field">
                  <label>Date Signed</label>
                  <input type="date" value={todayStr()} readOnly />
                </div>
              </div>

              {/* Data Privacy consent */}
              <div className="br-privacy-box">
                <p className="br-privacy-title">Data Privacy Act Consent</p>
                <p className="br-privacy-body">
                  In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), the Central
                  Student Government of Cavite State University – Imus Campus collects and processes
                  your personal information (name, student number, email address, and contact
                  number) solely for the purpose of processing your equipment borrow request. Your
                  data will not be shared with third parties without your consent and will be
                  retained only for the duration necessary to fulfill this purpose. You have the
                  right to access, correct, or request deletion of your personal data at any time by
                  contacting the CSG office.
                </p>
                <label className="br-privacy-check">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                  />
                  <span>
                    I have read and understood the Data Privacy Act consent above. I voluntarily
                    authorize the CSG to collect and use my personal information for this equipment
                    borrow request. <strong>*</strong>
                  </span>
                </label>
              </div>

              {submitError && <p className="br-error">{submitError}</p>}

              <button
                type="submit"
                className="br-btn-primary br-btn-full"
                disabled={submitting || !privacyConsent}
              >
                {submitting ? 'Submitting…' : 'Submit Reservation'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
