import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReservationCalendar, { type DateStatus } from '../../components/reservation-calendar/ReservationCalendar';
import {
  type AvailabilityEntry,
  type TimeSlot,
  computeDateStatus,
  TIME_SLOTS,
  timeSlotLabel,
  timeSlotShort,
  sameDayReturnAllowed,
} from './BorrowReservation';
import type { CartItem } from './Borrow';
import './borrow-reservation.css';
import './borrow.css';
import './borrow-checkout.css';

const API_URL    = import.meta.env.VITE_API_URL as string;
const CART_KEY   = "csg-borrow-cart";

type PurposeType = 'academic' | 'event' | 'organization' | 'others' | '';

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const todayStr = () => new Date().toISOString().split('T')[0];

const maxBookingDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

const ITEM_GRADIENTS: [string, string][] = [
  ['#1e3a8a','#4f6fd1'], ['#7c2d12','#dc2626'], ['#0f766e','#5eb5af'],
  ['#475569','#94a3b8'], ['#92400e','#a87c2d'], ['#3b5fbc','#8aaae0'],
  ['#1e3a8a','#3b5fbc'], ['#7c2d12','#ea580c'],
];
function itemGradient(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ITEM_GRADIENTS[Math.abs(h) % ITEM_GRADIENTS.length];
}

/* ── Icons ───────────────────────────────────────────────────────────────────── */

const BackIcon   = () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const CheckIcon  = () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 10 17 19 7"/></svg>;
const XIcon      = () => <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const PlusIcon   = () => <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const ArrowIcon  = () => <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const ShieldIcon = () => <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6z"/></svg>;
const PrintIcon  = () => <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const ClockIcon  = () => <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

/* ── Section wrapper ─────────────────────────────────────────────────────────── */

interface SectionProps {
  num: number;
  title: React.ReactNode;
  sub?: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}
function ChkSection({ num, title, sub, status, children }: SectionProps) {
  return (
    <section className="chk-section">
      <div className="chk-section-head">
        <div className="chk-section-title">
          <span className="chk-section-num">{num}</span>
          <div>
            <h2>{title}</h2>
            {sub && <p className="chk-section-sub">{sub}</p>}
          </div>
        </div>
        {status && <span className="chk-section-status">{status}</span>}
      </div>
      {children}
    </section>
  );
}

/* ── Component ───────────────────────────────────────────────────────────────── */

export default function BorrowCheckout() {
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems: CartItem[] = (location.state as { cartItems?: CartItem[] })?.cartItems ?? [];

  useEffect(() => {
    if (cartItems.length === 0) navigate('/borrow', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── State ───────────────────────────────────────────────────────────────── */

  const [itemsAvailability, setItemsAvailability] = useState<Map<string, AvailabilityEntry[]>>(new Map());
  const [loadingAvail, setLoadingAvail]           = useState(true);
  const [availError, setAvailError]               = useState<string | null>(null);

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(cartItems.map(({ item, qty }) => [item.id, qty]))
  );

  const [calYear,  setCalYear]  = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd,   setRangeEnd]   = useState<string | null>(null);
  const [timeSlot,   setTimeSlot]   = useState<TimeSlot | null>(null);

  const [requesterName,       setRequesterName]       = useState('');
  const [studentNumber,       setStudentNumber]       = useState('');
  const [studentEmail,        setStudentEmail]        = useState('');
  const [contactNumber,       setContactNumber]       = useState('');
  const [organization,        setOrganization]        = useState('');
  const [positionInOrg,       setPositionInOrg]       = useState('');
  const [purposeType,         setPurposeType]         = useState<PurposeType>('');
  const [purposeOthersDetail, setPurposeOthersDetail] = useState('');
  const [activityName,        setActivityName]        = useState('');
  const [venue,               setVenue]               = useState('');
  const [signature,           setSignature]           = useState('');
  const [privacyConsent,      setPrivacyConsent]      = useState(false);

  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent,   setEmailSent]   = useState(false);
  const [step,        setStep]        = useState<'reserve' | 'success'>('reserve');

  /* Track submission timestamp for success screen */
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  /* ── Fetch availability ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (cartItems.length === 0) return;
    setLoadingAvail(true);
    Promise.all(
      cartItems.map(async ({ item }) => {
        try {
          const { data } = await axios.get<AvailabilityEntry[]>(
            `${API_URL}/borrowing/availability/${item.id}`
          );
          return [item.id, data] as [string, AvailabilityEntry[]];
        } catch {
          return [item.id, []] as [string, AvailabilityEntry[]];
        }
      })
    )
      .then((results) => { setItemsAvailability(new Map(results)); setLoadingAvail(false); })
      .catch(() => { setAvailError('Could not load availability. Please go back and try again.'); setLoadingAvail(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Combined date status ────────────────────────────────────────────────── */

  const getCombinedDateStatus = (dateStr: string): DateStatus => {
    if (dateStr < todayStr() || dateStr > maxBookingDate()) return 'past';
    let hasPartial = false;
    for (const { item } of cartItems) {
      const avail  = itemsAvailability.get(item.id) ?? [];
      const status = computeDateStatus(dateStr, avail, item.max_quantity);
      if (status === 'full')    return 'full';
      if (status === 'partial') hasPartial = true;
    }
    return hasPartial ? 'partial' : 'available';
  };

  /* ── Range conflict ──────────────────────────────────────────────────────── */

  const rangeConflict = useMemo(() => {
    if (!rangeStart || !rangeEnd) return false;
    const d   = new Date(rangeStart + 'T00:00:00');
    const end = new Date(rangeEnd   + 'T00:00:00');
    while (d <= end) {
      const ds = d.toISOString().split('T')[0];
      for (const { item } of cartItems) {
        const avail = itemsAvailability.get(item.id) ?? [];
        if (computeDateStatus(ds, avail, item.max_quantity) === 'full') return true;
      }
      d.setDate(d.getDate() + 1);
    }
    return false;
  }, [rangeStart, rangeEnd, itemsAvailability, cartItems]);

  /* ── Date selection ──────────────────────────────────────────────────────── */

  const handleDateSelect = (dateStr: string) => {
    if (dateStr > maxBookingDate()) return;
    setSubmitError(null);
    if (!rangeStart || rangeEnd) {
      setRangeStart(dateStr); setRangeEnd(null); setTimeSlot(null); return;
    }
    if (dateStr === rangeStart) {
      if (sameDayReturnAllowed(timeSlot)) { setRangeEnd(dateStr); return; }
      setRangeStart(null); setTimeSlot(null); return;
    }
    if (dateStr < rangeStart) { setRangeStart(dateStr); setRangeEnd(null); return; }
    setRangeEnd(dateStr);
  };

  useEffect(() => {
    if (rangeStart && rangeEnd === rangeStart && !sameDayReturnAllowed(timeSlot)) setRangeEnd(null);
    else if (rangeStart && !rangeEnd && sameDayReturnAllowed(timeSlot)) setRangeEnd(rangeStart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlot]);

  const clearRange = () => { setRangeStart(null); setRangeEnd(null); setTimeSlot(null); setSubmitError(null); };

  /* ── Max qty per item ────────────────────────────────────────────────────── */

  const getMaxAllowed = (itemId: string, maxQty: number): number => {
    if (!rangeStart) return maxQty;
    const avail = itemsAvailability.get(itemId) ?? [];
    const reserved = avail
      .filter((r) => r.borrow_date <= rangeStart && rangeStart <= r.return_date)
      .reduce((s, r) => s + r.quantity_requested, 0);
    return Math.max(1, maxQty - reserved);
  };

  /* ── Remove item from cart ───────────────────────────────────────────────── */

  const [localCart, setLocalCart] = useState<CartItem[]>(cartItems);

  const removeItem = (itemId: string) => {
    const next = localCart.filter((c) => c.item.id !== itemId);
    setLocalCart(next);
    if (next.length === 0) navigate('/borrow');
  };

  /* ── Submit ──────────────────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!rangeStart || !rangeEnd) {
      setSubmitError('Please select a borrow date and return date on the calendar.'); return;
    }
    if (!timeSlot) {
      setSubmitError('Please select a time slot.'); return;
    }
    if (rangeConflict) {
      setSubmitError('Your selected date range includes fully booked dates. Please choose another range.'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requesterName.trim() || !studentNumber.trim()) {
      setSubmitError('Please fill in all required fields.'); return;
    }
    if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
      setSubmitError('Please enter a valid student email address.'); return;
    }
    if (!signature.trim()) {
      setSubmitError('Please provide your signature (typed name).'); return;
    }
    if (!privacyConsent) {
      setSubmitError('Please read and accept the Data Privacy Act consent before submitting.'); return;
    }

    setSubmitting(true);
    try {
      const { data: result } = await axios.post<{ message: string; email_sent: boolean }>(
        `${API_URL}/borrowing/request`,
        {
          borrower_name:         requesterName,
          borrower_id:           studentNumber,
          borrower_email:        studentEmail.trim(),
          student_email:         studentEmail.trim(),
          contact_number:        contactNumber        || undefined,
          organization:          organization         || undefined,
          position_in_org:       positionInOrg        || undefined,
          purpose_type:          purposeType          || undefined,
          purpose_others_detail: purposeOthersDetail  || undefined,
          activity_name:         activityName         || undefined,
          venue:                 venue                || undefined,
          borrow_date:           rangeStart,
          return_date:           rangeEnd,
          time_of_use:           timeSlotLabel(timeSlot),
          equipment_items: localCart.map(({ item }) => ({
            equipment_id:       item.id,
            quantity_requested: quantities[item.id] ?? 1,
          })),
        },
      );
      setEmailSent(result?.email_sent ?? false);
      setSubmittedAt(new Date());
      try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
      setStep('success');
    } catch (err: unknown) {
      const d   = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const msg = d?.error ?? d?.message ?? 'Submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ──────────────────────────────────────────────────────── */

  if (step === 'success') {
    const totalUnits = localCart.reduce((s, { item }) => s + (quantities[item.id] ?? 1), 0);
    const submissionLabel = submittedAt
      ? submittedAt.toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : 'Just now';

    return (
      <div className="chk-root">
        <div className="chk-success-page">
          <div className="chk-success-card">
            <div className="chk-success-ico">
              <CheckIcon />
            </div>
            <h1>Reservation <em>submitted</em></h1>
            <p>
              Your borrow request has been sent to the CSG office. We'll email you a confirmation
              as soon as someone reviews it — usually within 24 hours.
            </p>

            <div className="chk-success-ref">
              <span className="chk-success-ref-lbl">Submitted</span>
              {submissionLabel}
            </div>

            <div className="chk-success-detail">
              <div className="chk-success-detail-row">
                <span className="chk-success-detail-lbl">Items reserved</span>
                <span className="chk-success-detail-val">
                  {localCart.length} item{localCart.length !== 1 ? 's' : ''} · {totalUnits} unit{totalUnits !== 1 ? 's' : ''} total
                </span>
              </div>
              <div className="chk-success-detail-row">
                <span className="chk-success-detail-lbl">Borrow window</span>
                <span className="chk-success-detail-val">
                  {rangeStart ? formatShortDate(rangeStart) : '—'} → {rangeEnd ? formatShortDate(rangeEnd) : '—'}
                </span>
              </div>
              <div className="chk-success-detail-row">
                <span className="chk-success-detail-lbl">Time slot</span>
                <span className="chk-success-detail-val">
                  {timeSlot ? timeSlotShort(timeSlot) : '—'}
                </span>
              </div>
              <div className="chk-success-detail-row">
                <span className="chk-success-detail-lbl">Pickup at</span>
                <span className="chk-success-detail-val">CSG Office · Old Admin Bldg.</span>
              </div>
            </div>

            {emailSent ? (
              <p className="chk-success-email chk-success-email--ok">✓ A confirmation email was sent to your address.</p>
            ) : (
              <p className="chk-success-email chk-success-email--warn">Note: We were unable to send a confirmation email. Your request was saved.</p>
            )}

            <div className="chk-success-actions">
              <button className="chk-btn-ghost" type="button" onClick={() => window.print()}>
                <PrintIcon />Print receipt
              </button>
              <button
                className="chk-btn-primary"
                type="button"
                onClick={() => navigate('/borrow')}
              >
                Back to equipment list <ArrowIcon />
              </button>
            </div>

            <div className="chk-success-next">
              <div className="chk-success-next-eyebrow">What happens next</div>
              <ol className="chk-success-next-list">
                <li>The CSG office reviews your request (usually within 24 hours).</li>
                <li>You'll receive an approval email with the pickup time and any conditions.</li>
                <li>Drop by the CSG Office on your borrow date with your student ID.</li>
                <li>Return everything by the agreed time. Late returns may affect future requests.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading / error states ──────────────────────────────────────────────── */

  if (loadingAvail) {
    return (
      <div className="chk-root">
        <div className="chk-loading-page">Loading availability for your selected items…</div>
      </div>
    );
  }

  if (availError) {
    return (
      <div className="chk-root">
        <div className="chk-error-page">
          <p>{availError}</p>
          <button className="chk-btn-ghost" type="button" onClick={() => navigate('/borrow')}>
            <BackIcon />Back to Equipment List
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived for sidebar ─────────────────────────────────────────────────── */

  const totalQty = localCart.reduce((s, { item }) => s + (quantities[item.id] ?? 1), 0);

  /* ── Main form ───────────────────────────────────────────────────────────── */

  return (
    <div className="chk-root">
      <a className="chk-back" href="/borrow">
        <BackIcon />Back to equipment list
      </a>

      <div className="chk-hero">
        <div className="chk-hero-eyebrow">Reservation · Step 2 of 2</div>
        <h1>Reserve <em>{localCart.length} item{localCart.length !== 1 ? 's' : ''}</em> from the CSG equipment list</h1>
        <p>Confirm your borrow window, fill in your contact details, and submit. The summary on the right updates as you go.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="chk-page">
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Section 1 — Schedule */}
            <ChkSection
              num={1}
              title={<>When do you need it?</>}
              sub="Pick a date range (up to 7 days ahead) and a time slot."
              status={rangeStart && rangeEnd && timeSlot ? 'Scheduled' : undefined}
            >
              <div className="chk-schedule-grid">
                {/* Calendar */}
                <div>
                  <ReservationCalendar
                    year={calYear}
                    month={calMonth}
                    onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
                    variant="user"
                    getDateStatus={getCombinedDateStatus}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onSelectDate={handleDateSelect}
                  />

                  {/* Date selection summary */}
                  {rangeStart && (
                    <div className="chk-cal-confirm">
                      <div className="chk-cal-confirm-inner">
                        <div className="chk-cal-confirm-row">
                          <span className="chk-cal-confirm-lbl">Borrow</span>
                          <span className="chk-cal-confirm-val">{formatDisplayDate(rangeStart)}</span>
                        </div>
                        {rangeEnd && (
                          <div className="chk-cal-confirm-row">
                            <span className="chk-cal-confirm-lbl">Return</span>
                            <span className="chk-cal-confirm-val">{formatDisplayDate(rangeEnd)}</span>
                          </div>
                        )}
                        {timeSlot && (
                          <div className="chk-cal-confirm-row">
                            <span className="chk-cal-confirm-lbl">Slot</span>
                            <span className="chk-cal-confirm-chip">{timeSlotShort(timeSlot)}</span>
                          </div>
                        )}
                      </div>
                      <button type="button" className="chk-cal-confirm-clear" onClick={clearRange} aria-label="Clear selection">×</button>
                    </div>
                  )}

                  {rangeConflict && (
                    <p className="chk-cal-conflict">
                      ⚠ Some dates in this range are fully booked for one or more items. Please choose a different range.
                    </p>
                  )}

                  {rangeStart && !rangeEnd && (
                    <p className="chk-cal-hint">
                      {!timeSlot
                        ? 'Select a time slot → then pick a return date'
                        : sameDayReturnAllowed(timeSlot)
                          ? 'Click the same date or a later date to set the return'
                          : 'Click a later date to set the return date'}
                    </p>
                  )}
                </div>

                {/* Time slots */}
                <div>
                  <div className="chk-slot-label">Time slot</div>
                  <div className="chk-slots">
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot.id}
                        className={`chk-slot${timeSlot === slot.id ? ' is-selected' : ''}`}
                        onClick={() => setTimeSlot(slot.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setTimeSlot(slot.id)}
                      >
                        <div className="chk-slot-name">{slot.label}</div>
                        <div className="chk-slot-time">{slot.sub}</div>
                        <span className={`chk-slot-tag is-${slot.sameDayReturn ? 'good' : 'warn'}`}>
                          {slot.sameDayReturn ? <CheckIcon /> : <ClockIcon />}
                          {slot.note}
                        </span>
                        <span className="chk-slot-check"><CheckIcon /></span>
                      </div>
                    ))}
                  </div>
                  {timeSlot && !rangeEnd && (
                    <p className="chk-cal-hint" style={{ marginTop: 10 }}>← Now pick a return date on the calendar</p>
                  )}
                </div>
              </div>
            </ChkSection>

            {/* Section 2 — Items */}
            <ChkSection
              num={2}
              title={<>What you&rsquo;re borrowing</>}
              sub="Adjust quantities here. Removing items returns them to the catalog."
              status={`${totalQty} item${totalQty !== 1 ? 's' : ''}`}
            >
              <div className="chk-items">
                {localCart.map(({ item }) => {
                  const max = getMaxAllowed(item.id, item.max_quantity);
                  const qty = quantities[item.id] ?? 1;
                  const [g1, g2] = itemGradient(item.id);
                  return (
                    <div className="chk-item-row" key={item.id}>
                      <span
                        className="chk-item-thumb"
                        style={{ background: `linear-gradient(135deg, ${g1}25, ${g2}25)` }}
                      >
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                          : <img src="/CSG_logo.svg" alt="CSG" />}
                      </span>
                      <div className="chk-item-info">
                        <span className="chk-item-name">{item.name}</span>
                        <span className="chk-item-meta">{item.max_quantity} in stock total</span>
                      </div>
                      <div className="chk-item-stepper">
                        <button
                          type="button"
                          className="chk-item-step-btn"
                          disabled={qty <= 1}
                          onClick={() =>
                            setQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, qty - 1) }))
                          }
                        >−</button>
                        <span className="chk-item-step-val">{qty}</span>
                        <button
                          type="button"
                          className="chk-item-step-btn"
                          disabled={qty >= max}
                          onClick={() =>
                            setQuantities((prev) => ({ ...prev, [item.id]: Math.min(max, qty + 1) }))
                          }
                        >+</button>
                      </div>
                      <button
                        type="button"
                        className="chk-item-remove"
                        title="Remove from request"
                        onClick={() => removeItem(item.id)}
                      >
                        <XIcon />
                      </button>
                    </div>
                  );
                })}
                <a className="chk-items-add" href="/borrow">
                  <PlusIcon />Add more equipment
                </a>
              </div>
            </ChkSection>

            {/* Section 3 — Requester */}
            <ChkSection
              num={3}
              title={<>Who&rsquo;s requesting?</>}
              sub="We use this to confirm your identity and reach out if there's a question."
              status={requesterName ? 'Ready' : undefined}
            >
              <div className="chk-row">
                <div className="chk-field">
                  <label className="chk-label">Full name <span className="req">*</span></label>
                  <input
                    className="chk-input"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Last, First Middle"
                    required
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Organization</label>
                  <input
                    className="chk-input"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. CSG, CCS Student Council"
                  />
                </div>
              </div>
              <div className="chk-row">
                <div className="chk-field">
                  <label className="chk-label">Student number <span className="req">*</span></label>
                  <input
                    className="chk-input"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="e.g. 2021-00123"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Student email <span className="req">*</span></label>
                  <input
                    className="chk-input"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="your.email@cvsu.edu.ph"
                    required
                  />
                </div>
              </div>
              <div className="chk-row">
                <div className="chk-field">
                  <label className="chk-label">Position in org</label>
                  <input
                    className="chk-input"
                    value={positionInOrg}
                    onChange={(e) => setPositionInOrg(e.target.value)}
                    placeholder="e.g. President, Member"
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Contact number</label>
                  <input
                    className="chk-input"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 09XX-XXX-XXXX"
                  />
                </div>
              </div>
            </ChkSection>

            {/* Section 4 — Purpose */}
            <ChkSection
              num={4}
              title={<>What&rsquo;s the <em>purpose</em>?</>}
              sub="A short description helps the office prioritise and follow up."
            >
              <div className="chk-field" style={{ marginBottom: 14 }}>
                <label className="chk-label">Purpose of equipment use</label>
                <div className="chk-check-grid">
                  {([ 'academic', 'event', 'organization', 'others' ] as PurposeType[]).map((pt) => (
                    <div
                      key={pt}
                      className={`chk-check${purposeType === pt ? ' is-checked' : ''}`}
                      onClick={() => setPurposeType(purposeType === pt ? '' : pt)}
                      role="checkbox"
                      aria-checked={purposeType === pt}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setPurposeType(purposeType === pt ? '' : pt)}
                    >
                      <span className="chk-check-box">{purposeType === pt && <CheckIcon />}</span>
                      {pt === 'academic'     && 'Academic / Class use'}
                      {pt === 'event'        && 'Event / Program'}
                      {pt === 'organization' && 'Organization activity'}
                      {pt === 'others'       && 'Other'}
                    </div>
                  ))}
                </div>
                {purposeType === 'others' && (
                  <input
                    className="chk-input chk-others-input"
                    value={purposeOthersDetail}
                    onChange={(e) => setPurposeOthersDetail(e.target.value)}
                    placeholder="Please specify"
                    style={{ marginTop: 10 }}
                  />
                )}
              </div>
              <div className="chk-row">
                <div className="chk-field">
                  <label className="chk-label">Event / activity name</label>
                  <input
                    className="chk-input"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="e.g. General Assembly"
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Venue / location</label>
                  <input
                    className="chk-input"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. College Auditorium"
                  />
                </div>
              </div>
            </ChkSection>

            {/* Section 5 — Acknowledge & Submit */}
            <ChkSection
              num={5}
              title={<>Acknowledge &amp; <em>submit</em></>}
              sub="Read the responsibility statement, sign with your full name, and confirm consent."
            >
              <div className="chk-ack">
                I hereby certify that the information above is true and correct. I agree to use the
                requested equipment responsibly, return it in the same condition, and accept liability
                for loss or damage during my custody.
              </div>

              <div className="chk-row">
                <div className="chk-field">
                  <label className="chk-label">Signature (type your full name) <span className="req">*</span></label>
                  <div className="chk-sig-wrap">
                    <div className="chk-sig">
                      {signature || <span className="chk-sig-placeholder">Your full name</span>}
                    </div>
                    <div className="chk-sig-line">Signature</div>
                  </div>
                  <input
                    className="chk-input"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name as signature"
                    required
                    style={{ marginTop: 8 }}
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Date signed</label>
                  <input
                    className="chk-input"
                    value={new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    readOnly
                  />
                  <span className="chk-hint">Auto-filled from today's date.</span>
                </div>
              </div>

              <div className="chk-dpa">
                <div className="chk-dpa-head">
                  <ShieldIcon />
                  <span className="chk-dpa-title">Data Privacy Act Consent</span>
                </div>
                <p className="chk-dpa-body">
                  In compliance with Republic Act 10173, the CSG of CvSU-Imus collects and processes
                  your name, student number, email, and contact number solely for handling this borrow
                  request. Data won't be shared with third parties and will be retained only as long as
                  needed. You may request access, correction, or deletion at any time.
                </p>
                <div
                  className={`chk-dpa-check${privacyConsent ? ' is-checked' : ''}`}
                  onClick={() => setPrivacyConsent((v) => !v)}
                  role="checkbox"
                  aria-checked={privacyConsent}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPrivacyConsent((v) => !v)}
                >
                  <span className="chk-check-box">{privacyConsent && <CheckIcon />}</span>
                  <span className="chk-dpa-check-text">
                    I have read and understood the consent above. I voluntarily authorize the CSG to
                    collect and use my personal information for this equipment borrow request.{' '}
                    <span style={{ color: 'var(--color-danger-text)' }}>*</span>
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="chk-submit"
                disabled={submitting || !privacyConsent}
                style={{ marginTop: 18 }}
              >
                <CheckIcon />
                {submitting ? 'Submitting…' : 'Submit reservation'}
              </button>
              <p className="chk-submit-hint">
                You'll receive an email confirmation and the CSG office will review your request within 24 hours.
              </p>
            </ChkSection>
          </div>

          {/* ── RIGHT COLUMN: Sticky summary sidebar ── */}
          <aside className="chk-summary">
            <div className="chk-summary-head">
              <div className="chk-summary-eyebrow">Your reservation</div>
              <h3 className="chk-summary-h">
                <em>{totalQty}</em> item{totalQty !== 1 ? 's' : ''} ready to file
              </h3>
            </div>

            <div className="chk-summary-body">
              {/* Equipment */}
              <div className="chk-summary-block">
                <div className="chk-summary-lbl">Equipment</div>
                <div className="chk-summary-items">
                  {localCart.map(({ item }) => (
                    <div className="chk-summary-item" key={item.id}>
                      <span className="chk-summary-item-name">{item.name}</span>
                      <span className="chk-summary-item-qty">×{quantities[item.id] ?? 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              {rangeStart && (
                <div className="chk-summary-block">
                  <div className="chk-summary-lbl">Borrow window</div>
                  <div className="chk-summary-dates">
                    <div className="chk-summary-date">
                      <div className="chk-summary-date-lbl">Pick up</div>
                      <div className="chk-summary-date-val">{formatShortDate(rangeStart)}</div>
                    </div>
                    {rangeEnd && (
                      <div className="chk-summary-date">
                        <div className="chk-summary-date-lbl">Return</div>
                        <div className="chk-summary-date-val">{formatShortDate(rangeEnd)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Time slot */}
              {timeSlot && (
                <div className="chk-summary-block">
                  <div className="chk-summary-lbl">Time slot</div>
                  <div className="chk-summary-slot">{timeSlotShort(timeSlot)}</div>
                  <div className="chk-summary-slot-time">{TIME_SLOTS.find(s => s.id === timeSlot)?.sub}</div>
                </div>
              )}

              {/* Requester */}
              <div className="chk-summary-block">
                <div className="chk-summary-lbl">Requester</div>
                {requesterName ? (
                  <>
                    <div className="chk-summary-req">{requesterName}</div>
                    {(organization || positionInOrg) && (
                      <div className="chk-summary-req-org">
                        {[organization, positionInOrg].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="chk-summary-req--empty">Fill in your details below</div>
                )}
              </div>
            </div>

            <div className="chk-summary-foot">
              {submitError && (
                <p className="chk-summary-error">{submitError}</p>
              )}
              <button
                type="submit"
                className="chk-submit"
                disabled={submitting || !privacyConsent}
              >
                <CheckIcon />
                {submitting ? 'Submitting…' : 'Submit reservation'}
              </button>
              <p>You'll receive a confirmation email and the CSG office will review within 24 hours.</p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
