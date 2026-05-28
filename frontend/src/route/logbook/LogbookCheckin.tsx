/**
 * LogbookCheckin — /logbook
 *
 * Standalone page (no RootLayout nav). Officers scan the rotating QR in the
 * CSG office, which links here with ?token=TOKEN. They select their name,
 * enter their student number, and allow geolocation to check in.
 *
 * ?action=checkout skips the check-in form and shows a checkout-only selector.
 * No token and no action → NoToken fallback card.
 *
 * Security: student_number is NEVER logged. The field uses autoComplete="off"
 * and spellCheck={false}. Never put student_number in console.log.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/CSG_logo.svg';
import './kiosk.css';

const API = import.meta.env.VITE_API_URL as string;

/* ── Types ── */
interface RawOfficer {
  id:        string;
  full_name: string;
  position:  string;
  committee?: string | null; // UUID FK → committees.id
}
interface Committee {
  id:   string;
  name: string;
}
interface Officer {
  id:              string;
  full_name:       string;
  position:        string;        // raw from API
  displayPosition: string;        // cleaned for display
  committee_name:  string | null;
}
interface OpenSession {
  id:         string;
  check_in_at: string;
}
interface CheckinSuccessData {
  officer_name: string;
  check_in_at:  string;
}
interface CheckoutSuccessData {
  officer_name:  string;
  check_in_at:   string;
  check_out_at:  string;
}

type GeoState = 'pending' | 'granted' | 'denied' | 'unavailable';
type Phase =
  | 'form'
  | 'too-far'
  | 'token-expired'
  | 'success'
  | 'checkout-form'
  | 'checkout-success'
  | 'already-in';   // officer already has an open session — offer remote checkout

/* ── Helpers ── */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function durStr(checkInAt: string, checkOutAt?: string): string {
  const end = checkOutAt ? new Date(checkOutAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - new Date(checkInAt).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Classify a backend error into: too-far (with distance), token-expired, or inline. */
function classifyCheckinError(err: unknown): (
  | { type: 'too-far';       dist: string }
  | { type: 'token-expired' }
  | { type: 'inline';        msg: string  }
) {
  const res    = (err as { response?: { status?: number; data?: { error?: string } } })?.response;
  const status = res?.status ?? 0;
  const msg    = res?.data?.error ?? '';

  if (status === 401 && msg.toLowerCase().includes('qr code')) {
    return { type: 'token-expired' };
  }
  if (status === 403 && msg.toLowerCase().includes('from the office')) {
    const match = msg.match(/(\d[\d,]+)\s*m/);
    const dist  = match ? `${match[1]} m` : '?';
    return { type: 'too-far', dist };
  }
  return { type: 'inline', msg: msg || 'Something went wrong. Please try again.' };
}

/* ── Position helpers ── */

/**
 * Returns the single primary position from a raw position string.
 * Handles:
 *   - Comma-separated lists: "SAP Administration,Assistant Secretary,Chair" → "SAP Administration"
 *   - Concatenated roles (no space): "TreasurerFinance Chairperson" → "Treasurer"
 *     (detected by lowercase→uppercase boundary)
 */
function parseFirstPosition(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const seg   = raw.split(/[,;/]/)[0];
  const first = seg.replace(/([a-z])([A-Z])/g, '$1|||$2').split('|||')[0].trim();
  return first || raw.trim();
}

/**
 * Rank positions so we can pick the "highest" when the same officer
 * appears under multiple roles.
 *   3 = CSG executive
 *   2 = committee lead
 *   1 = other named role
 *   0 = Member / Associate (lowest)
 */
function rankPosition(pos: string): number {
  if (/president|secretary general|treasurer|auditor|public relations officer/i.test(pos)) return 3;
  if (/vice president|assistant secretary/i.test(pos)) return 3;
  if (/chairperson|chair\b|head\b|coordinator|adviser|director/i.test(pos)) return 2;
  if (/^member$|^associate$/i.test(pos.trim())) return 0;
  return 1;
}

/* ── Officer combobox ── */
function OfficerCombobox({
  officers, value, onChange, disabled,
}: {
  officers: Officer[];
  value:    string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [open,   setOpen]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* If external code clears the selection, clear the typed text too */
  useEffect(() => {
    if (!value) setSearch('');
  }, [value]);

  const filtered = search.trim()
    ? officers.filter((o) => {
        const name  = o.full_name.toLowerCase();
        const words = search.trim().toLowerCase().split(/\s+/);
        return words.every((w) => name.includes(w));
      })
    : officers;

  const handleSelect = (o: Officer) => {
    onChange(o.id);
    setSearch(o.full_name);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="kk-field-input"
        type="text"
        value={search}
        placeholder={disabled ? 'Loading officers…' : 'Type your name…'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(''); // clear selection while user is typing
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        /* delay so onMouseDown on an option fires before blur closes the list */
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {open && (
        <div className="kk-combo-drop">
          {filtered.length === 0 ? (
            <div className="kk-combo-empty">No matches found</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`kk-combo-opt${value === o.id ? ' is-selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
              >
                <span className="kk-combo-name">{o.full_name}</span>
                <span className="kk-combo-pos">{o.displayPosition}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function KkBrand() {
  return (
    <div className="kk-brand">
      <img src={logo} alt="CSG Logo" width={36} height={36} style={{ borderRadius: '50%' }}/>
      <div className="kk-brand-text">
        <span className="kk-brand-name">CSG-OITS</span>
        <span className="kk-brand-sub">Cavite State University — Imus</span>
      </div>
    </div>
  );
}

/* ── Inline icon helpers ── */
const IcoCheck = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="5 12 10 17 19 7"/>
  </svg>
);
const IcoGeo = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoGeoOff = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);
const IcoWarn = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IcoOut = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoQr = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9 0h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm-3-5h2v2h-2v-2zm3 0h2v2h-2v-2zm-3-3h2v2h-2v-2zm3 0h2v2h-2v-2z"/>
  </svg>
);

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
export default function LogbookCheckin() {
  const [searchParams]   = useSearchParams();
  const token            = searchParams.get('token') ?? '';
  const isCheckoutMode   = searchParams.get('action') === 'checkout';
  const noToken          = !token && !isCheckoutMode;

  /* ── Officers list ── */
  const [officers,        setOfficers]        = useState<Officer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  /* ── Form state ── */
  const [officerId,     setOfficerId]     = useState('');
  const [studentNumber, setStudentNumber] = useState('');

  /* ── Geolocation ── */
  const [geoState, setGeoState] = useState<GeoState>('pending');
  const [lat,      setLat]      = useState<number | null>(null);
  const [lng,      setLng]      = useState<number | null>(null);

  /* ── Phase / results ── */
  const [phase,               setPhase]               = useState<Phase>(isCheckoutMode ? 'checkout-form' : 'form');
  const [successData,         setSuccessData]         = useState<CheckinSuccessData | null>(null);
  const [checkoutSuccessData, setCheckoutSuccessData] = useState<CheckoutSuccessData | null>(null);
  const [tooFarDist,          setTooFarDist]          = useState('');

  /* ── Error + loading ── */
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Open session info (for checkout summary) ── */
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);

  /* ── Fetch active officers + committees, then deduplicate ── */
  useEffect(() => {
    Promise.allSettled([
      axios.get<RawOfficer[]>(`${API}/officers/`, { params: { status: 'active' } }),
      axios.get<Committee[]>(`${API}/committees/`),
    ]).then(([officersResult, committeesResult]) => {
      /* If officers fetch failed entirely, bail out */
      if (officersResult.status === 'rejected') return;

      const rawOfficers = officersResult.value.data ?? [];

      /* Committee name lookup — gracefully degraded if committees fetch failed */
      const committeeMap = new Map<string, string>();
      if (committeesResult.status === 'fulfilled') {
        for (const c of (committeesResult.value.data ?? [])) {
          committeeMap.set(String(c.id), c.name);
        }
      }

      /* Deduplicate: one record per full_name, keeping the highest-ranked position */
      const best = new Map<string, { raw: RawOfficer; rank: number }>();
      for (const raw of rawOfficers) {
        const parsed = parseFirstPosition(raw.position ?? '');
        const rank   = rankPosition(parsed);
        const prev   = best.get(raw.full_name);
        if (!prev || rank > prev.rank) best.set(raw.full_name, { raw, rank });
      }

      /* Build display-ready officer list */
      const processed: Officer[] = Array.from(best.values()).map(({ raw }) => {
        const parsed     = parseFirstPosition(raw.position ?? '');
        const commitName = raw.committee ? (committeeMap.get(String(raw.committee)) ?? null) : null;
        const displayPosition =
          /^member$|^associate$/i.test(parsed.trim()) && commitName
            ? `Member · ${commitName}`
            : parsed;
        return {
          id:             raw.id,
          full_name:      raw.full_name,
          position:       raw.position ?? '',
          displayPosition,
          committee_name: commitName,
        };
      });

      /* Sort alphabetically */
      processed.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setOfficers(processed);
    })
    .finally(() => setOfficersLoading(false));
  }, []);

  /* ── Geolocation (check-in mode only) ── */
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState('unavailable');
      return;
    }
    setGeoState('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    if (isCheckoutMode || noToken) return;
    requestGeo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch open session whenever officer is selected ──────────────────────
     Runs in BOTH check-in ('form') and checkout ('checkout-form') modes.
     In check-in mode: if the officer already has an open session today, we
     transition to 'already-in' so they can close it remotely without needing
     to re-verify their location (the original check-in was already geo-gated).
  ── */
  useEffect(() => {
    if (!officerId || !['form', 'checkout-form', 'already-in'].includes(phase)) {
      setOpenSession(null);
      return;
    }
    let cancelled = false;
    axios
      .get<{ open_session: OpenSession | null }>(`${API}/logbook/status/${officerId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setOpenSession(data.open_session);
        // In check-in mode: if session already exists, offer remote checkout instead
        if (phase === 'form' && data.open_session) {
          setPhase('already-in');
        }
      })
      .catch(() => { if (!cancelled) setOpenSession(null); });
    return () => { cancelled = true; };
  }, [officerId, phase]);

  /* ── Handlers ── */
  const handleCheckin = useCallback(async () => {
    if (!officerId || !studentNumber.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/logbook/checkin`, {
        token,
        officer_id:     officerId,
        student_number: studentNumber.trim(),
        ...(lat != null && lng != null ? { lat, lng } : {}),
      });
      setSuccessData({
        officer_name: data.officer_name,
        check_in_at:  data.session.check_in_at,
      });
      setPhase('success');
    } catch (err) {
      const classified = classifyCheckinError(err);
      if (classified.type === 'token-expired') {
        setPhase('token-expired');
      } else if (classified.type === 'too-far') {
        setTooFarDist(classified.dist);
        setPhase('too-far');
      } else {
        setError(classified.msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, officerId, studentNumber, lat, lng]);

  /**
   * Re-check-in after an accidental checkout (session < 5 min).
   * No QR token required — server validates the recency of the short session.
   */
  const handleRecheck = useCallback(async () => {
    if (!officerId) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/logbook/recheck-in`, { officer_id: officerId });
      setSuccessData({
        officer_name: data.officer_name,
        check_in_at:  data.session.check_in_at,
      });
      setPhase('success');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Could not re-check in. Please scan the QR code again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [officerId]);

  const handleCheckout = useCallback(async () => {
    if (!officerId) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/logbook/checkout`, { officer_id: officerId });
      const officerName =
        data.officer_name ??
        officers.find((o) => o.id === officerId)?.full_name ??
        '';
      setCheckoutSuccessData({
        officer_name: officerName,
        check_in_at:  data.session?.check_in_at ?? openSession?.check_in_at ?? '',
        check_out_at: data.session?.check_out_at ?? new Date().toISOString(),
      });
      setPhase('checkout-success');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Could not check out. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [officerId, officers, openSession]);

  /* ══════════════════════════════════════════════
     RENDER — always in kk-root > kk-phone wrapper
     ══════════════════════════════════════════════ */
  const renderContent = () => {
    /* ── No token (neither ?token= nor ?action=checkout) ── */
    if (noToken) {
      return (
        <div className="kk-card">
          <div className="kk-error-ico is-warn">
            <IcoQr width={34} height={34}/>
          </div>
          <h1 className="kk-error-h">
            No <em>QR token</em>
          </h1>
          <p className="kk-error-p">
            This page is reached by scanning the QR code displayed in the
            CSG office. Drop by and scan to check in.
          </p>
          <a
            href="/logbook?action=checkout"
            className="kk-btn kk-btn--ghost"
            style={{ textDecoration: 'none' }}
          >
            <IcoOut width={15} height={15}/>
            Check out instead
          </a>
          <a
            href="/office"
            className="kk-btn kk-btn--primary"
            style={{ textDecoration: 'none', marginTop: 8 }}
          >
            Visit office hours page
          </a>
        </div>
      );
    }

    /* ── Geo-denied (auto-shown when in check-in form and location refused) ── */
    if (phase === 'form' && (geoState === 'denied' || geoState === 'unavailable')) {
      return (
        <div className="kk-card">
          <div className="kk-error-ico is-warn">
            <IcoGeoOff width={34} height={34}/>
          </div>
          <h1 className="kk-error-h">
            Location permission <em>required</em>
          </h1>
          <p className="kk-error-p">
            We need to confirm you&rsquo;re physically in the office.
            Tap <strong>Allow location</strong> when your browser prompts you,
            then try again.
          </p>
          <div className="kk-error-detail">
            Tip: open <strong>Site settings</strong> in your browser if no
            prompt appears, and enable location for this site.
          </div>
          {geoState === 'denied' && (
            <button className="kk-btn kk-btn--primary" onClick={requestGeo}>
              Request permission
            </button>
          )}
          <a
            href="/office"
            className="kk-btn kk-btn--ghost"
            style={{ marginTop: 8, textDecoration: 'none' }}
          >
            Cancel
          </a>
        </div>
      );
    }

    /* ── Check-in form ── */
    if (phase === 'form') {
      return (
        <div className="kk-card">
          <span className="kk-token-pill">QR token valid</span>
          <h1>Check <em>in</em></h1>
          <p className="lead">
            Confirm your name and student number to start your office duty session.
          </p>

          {/* Officer combobox */}
          <div className="kk-field">
            <label className="kk-field-lbl">Your name</label>
            <OfficerCombobox
              officers={officers}
              value={officerId}
              onChange={(id) => {
                setOfficerId(id);
                setError('');
                // If user changes selection while already-in, fall back to form
                if (phase === 'already-in') setPhase('form');
              }}
              disabled={officersLoading}
            />
          </div>

          {/* Student number — security: autoComplete off, spellCheck off */}
          <div className="kk-field">
            <label className="kk-field-lbl">Student number</label>
            <input
              className="kk-field-input"
              type="text"
              value={studentNumber}
              onChange={(e) => { setStudentNumber(e.target.value); setError(''); }}
              placeholder="e.g. 202X-XXXXX"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <span className="kk-field-hint">
              We&rsquo;ll verify this matches the officer record.
            </span>
            {error && <span className="kk-field-err">{error}</span>}
          </div>

          {/* Geolocation status */}
          <div className="kk-geo">
            <span className={`kk-geo-ico ${geoState === 'granted' ? 'is-ok' : 'is-pending'}`}>
              {geoState === 'granted'
                ? <IcoGeo width={17} height={17}/>
                : <IcoGeo width={17} height={17}/>
              }
            </span>
            <div className="kk-geo-body">
              <span className="kk-geo-lbl">
                {geoState === 'granted' ? 'Location acquired' : 'Acquiring location…'}
              </span>
              <span className="kk-geo-sub">
                {geoState === 'granted'
                  ? 'Coordinates captured — radius will be verified on check-in.'
                  : 'Please allow location access when prompted.'}
              </span>
            </div>
            {geoState === 'granted' && (
              <IcoCheck width={20} height={20} style={{ color: 'var(--color-success-text)' }}/>
            )}
          </div>

          <button
            className="kk-btn kk-btn--primary"
            disabled={
              submitting         ||
              !officerId         ||
              !studentNumber.trim() ||
              geoState === 'pending'
            }
            onClick={handleCheckin}
          >
            {submitting ? 'Checking in…' : <>Check in <IcoCheck width={16} height={16}/></>}
          </button>
        </div>
      );
    }

    /* ── Too far ── */
    if (phase === 'too-far') {
      return (
        <div className="kk-card">
          <div className="kk-error-ico is-warn">
            <IcoGeoOff width={34} height={34}/>
          </div>
          <h1 className="kk-error-h">
            Too far from the <em>office</em>
          </h1>
          <p className="kk-error-p">
            Check-in requires physical presence at the CSG office. Your phone
            reports you&rsquo;re too far away right now.
          </p>
          {tooFarDist && (
            <div className="kk-error-detail">
              Distance: <strong>~{tooFarDist}</strong>
              {' '}&middot; Allowed radius: <strong>150 m</strong>
            </div>
          )}
          <button
            className="kk-btn kk-btn--primary"
            onClick={() => { setPhase('form'); setError(''); }}
          >
            Try again
          </button>
          <a
            href="/office"
            className="kk-btn kk-btn--ghost"
            style={{ marginTop: 8, textDecoration: 'none' }}
          >
            Cancel
          </a>
        </div>
      );
    }

    /* ── Token expired ── */
    if (phase === 'token-expired') {
      return (
        <div className="kk-card">
          <div className="kk-error-ico is-danger">
            <IcoWarn width={34} height={34}/>
          </div>
          <h1 className="kk-error-h">
            QR code <em>expired</em>
          </h1>
          <p className="kk-error-p">
            The QR you scanned has rotated. Scan the current code on the office
            display screen and try again.
          </p>
          <div className="kk-error-detail is-danger">
            QR codes rotate every 5 minutes for security.
          </div>
          <a
            href="/office"
            className="kk-btn kk-btn--ghost"
            style={{ textDecoration: 'none' }}
          >
            Cancel
          </a>
        </div>
      );
    }

    /* ── Check-in success ── */
    if (phase === 'success' && successData) {
      return (
        <div className="kk-card">
          <div className="kk-success-ico">
            <IcoCheck width={34} height={34}/>
          </div>
          <div className="kk-success-name">
            You&rsquo;re checked in
            <strong>{successData.officer_name}</strong>
          </div>

          <div className="kk-summary">
            <div className="kk-summary-row">
              <span className="lbl">Checked in at</span>
              <span className="val">{fmtTime(successData.check_in_at)}</span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Date</span>
              <span className="val">{fmtDateShort(successData.check_in_at)}</span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Location</span>
              <span className="val" style={{ color: 'var(--color-success-text)' }}>
                Verified ✓
              </span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.55, marginBottom: 18 }}>
            Have a productive shift. When you&rsquo;re ready to leave, tap below.
          </p>

          <div className="kk-btn-row">
            <a href="/office" className="kk-btn kk-btn--ghost" style={{ flex: 1, textDecoration: 'none' }}>
              Done
            </a>
            <button
              className="kk-btn kk-btn--primary"
              style={{ flex: 1.4 }}
              disabled={submitting}
              onClick={handleCheckout}
            >
              <IcoOut width={14} height={14}/>
              {submitting ? 'Checking out…' : 'Check out'}
            </button>
          </div>
        </div>
      );
    }

    /* ── Already checked in — offer remote checkout ── */
    if (phase === 'already-in' && openSession) {
      return (
        <div className="kk-card">
          <div className="kk-error-ico" style={{ background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}>
            <IcoWarn width={34} height={34}/>
          </div>
          <h1 className="kk-error-h">
            Still <em>checked in</em>
          </h1>
          <p className="kk-error-p">
            You have an open session from today. Since you originally checked in
            within the office, you can check out from wherever you are now.
          </p>

          <div className="kk-summary">
            <div className="kk-summary-row">
              <span className="lbl">Checked in at</span>
              <span className="val">{fmtTime(openSession.check_in_at)}</span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Time on duty</span>
              <span className="val duration">{durStr(openSession.check_in_at)}</span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Location check</span>
              <span className="val" style={{ color: 'var(--color-success-text)' }}>
                Verified on check-in ✓
              </span>
            </div>
          </div>

          {error && <span className="kk-field-err">{error}</span>}

          <div className="kk-btn-row">
            <button
              className="kk-btn kk-btn--ghost"
              style={{ flex: 1 }}
              onClick={() => { setPhase('form'); setOfficerId(''); setError(''); }}
            >
              Not me
            </button>
            <button
              className="kk-btn kk-btn--primary"
              style={{ flex: 1.4 }}
              disabled={submitting}
              onClick={handleCheckout}
            >
              <IcoOut width={14} height={14}/>
              {submitting ? 'Checking out…' : 'Check out'}
            </button>
          </div>
        </div>
      );
    }

    /* ── Checkout form ── */
    if (phase === 'checkout-form') {
      return (
        <div className="kk-card">
          <h1>Check <em>out</em></h1>
          <p className="lead">
            Select your name to close your open session. No QR scan needed.
          </p>

          <div className="kk-field">
            <label className="kk-field-lbl">Your name</label>
            <OfficerCombobox
              officers={officers}
              value={officerId}
              onChange={(id) => { setOfficerId(id); setError(''); }}
              disabled={officersLoading}
            />
            {error && <span className="kk-field-err">{error}</span>}
          </div>

          {/* Show open session summary when officer is selected */}
          {officerId && openSession && (
            <div className="kk-summary">
              <div className="kk-summary-row">
                <span className="lbl">Current session</span>
                <span className="val" style={{ color: 'var(--color-success-text)' }}>
                  ● Open since {fmtTime(openSession.check_in_at)}
                </span>
              </div>
              <div className="kk-summary-row">
                <span className="lbl">Time on duty so far</span>
                <span className="val duration">{durStr(openSession.check_in_at)}</span>
              </div>
            </div>
          )}
          {officerId && openSession === null && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              No open session found for this officer today.
            </p>
          )}

          <button
            className="kk-btn kk-btn--primary"
            disabled={submitting || !officerId}
            onClick={handleCheckout}
          >
            <IcoOut width={16} height={16}/>
            {submitting ? 'Checking out…' : 'Check out now'}
          </button>
        </div>
      );
    }

    /* ── Checkout success ── */
    if (phase === 'checkout-success' && checkoutSuccessData) {
      // Detect accidental checkout: session lasted less than 5 minutes
      const durationMs = checkoutSuccessData.check_in_at
        ? new Date(checkoutSuccessData.check_out_at).getTime()
          - new Date(checkoutSuccessData.check_in_at).getTime()
        : Infinity;
      const durationMin    = Math.floor(durationMs / 60_000);
      const isShortSession = durationMin < 5;

      return (
        <div className="kk-card">
          <div
            className="kk-success-ico"
            style={{ background: 'rgba(79,111,209,0.10)', color: 'var(--color-primary)' }}
          >
            <IcoOut width={32} height={32}/>
          </div>
          <div className="kk-success-name">
            Have a great rest of your day
            <strong>{checkoutSuccessData.officer_name}</strong>
          </div>

          <div className="kk-summary">
            <div className="kk-summary-row">
              <span className="lbl">Checked in</span>
              <span className="val">
                {checkoutSuccessData.check_in_at
                  ? fmtTime(checkoutSuccessData.check_in_at)
                  : '—'}
              </span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Checked out</span>
              <span className="val">{fmtTime(checkoutSuccessData.check_out_at)}</span>
            </div>
            <div className="kk-summary-row">
              <span className="lbl">Time on duty</span>
              <span className="val duration">
                {checkoutSuccessData.check_in_at
                  ? durStr(checkoutSuccessData.check_in_at, checkoutSuccessData.check_out_at)
                  : '—'}
              </span>
            </div>
          </div>

          {/* Accidental checkout banner — only when session was very short */}
          {isShortSession ? (
            <div className="kk-accident-banner">
              <span className="kk-accident-msg">
                That session was only{' '}
                {durationMin === 0 ? 'under a minute' : `${durationMin} min`} —
                accidental check-out?
              </span>
              {error && (
                <p style={{ fontSize: 12, color: 'var(--color-danger-text)', textAlign: 'center', margin: 0 }}>
                  {error}
                </p>
              )}
              <button
                className="kk-btn kk-btn--secondary"
                style={{ width: '100%' }}
                disabled={submitting}
                onClick={handleRecheck}
              >
                {submitting ? 'Checking in…' : 'Re-check in'}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.55, marginBottom: 18 }}>
              Your session has been logged. Thanks for serving.
            </p>
          )}

          <a href="/office" className="kk-btn kk-btn--ghost" style={{ textDecoration: 'none' }}>
            Done
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="kk-root kk-root--phone">
      <div className="kk-phone">
        <div className="kk-phone-body">
          <KkBrand/>
          {renderContent()}
          <div className="kk-foot">
            © 2026 CSG-OITS · Cavite State University, Imus Campus
          </div>
        </div>
      </div>
    </div>
  );
}
