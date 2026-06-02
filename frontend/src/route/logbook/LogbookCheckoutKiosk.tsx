/**
 * LogbookCheckoutKiosk — rendered at /logbook?action=checkout
 *
 * Full-screen 1920×1080 kiosk display for the physical checkout station.
 * Officers walk up to the screen, select their name in the large combobox,
 * and tap "Check out now". No QR scan needed.
 *
 * Auto-resets to the form 10 seconds after a successful checkout so the
 * next officer can use it immediately.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import logo from '../../assets/CSG_logo.svg';
import './kiosk.css';

const API = import.meta.env.VITE_API_URL as string;

/* ── Types ── */
interface RawOfficer {
  id:         string;
  full_name:  string;
  position:   string;
  committee?: string | null;
}
interface Committee {
  id:   string;
  name: string;
}
interface Officer {
  id:              string;
  full_name:       string;
  position:        string;
  displayPosition: string;
  committee_name:  string | null;
}
interface OpenSession {
  id:          string;
  check_in_at: string;
}
interface CheckoutData {
  officer_name: string;
  check_in_at:  string;
  check_out_at: string;
}
interface SessionEntry {
  id:           string;
  check_in_at:  string;
  check_out_at: string | null;
  auto_checkout: boolean;
  officer: {
    id:        string;
    full_name: string;
    position:  string;
  } | null;
}

/* ── Helpers ── */
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmtTimeFull(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtClock(d: Date): string {
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtDate(d: Date): string {
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function durStr(checkInAt: string, checkOutAt?: string): string {
  const end  = checkOutAt ? new Date(checkOutAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - new Date(checkInAt).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function getInits(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

/** Parse highest-ranked position from raw string */
function parseFirstPosition(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const seg   = raw.split(/[,;/]/)[0];
  const first = seg.replace(/([a-z])([A-Z])/g, '$1|||$2').split('|||')[0].trim();
  return first || raw.trim();
}
function rankPosition(pos: string): number {
  if (!pos || !pos.trim()) return -1;  // empty beats nothing — always loses to a real position
  if (/president|secretary general|treasurer|auditor|public relations officer/i.test(pos)) return 3;
  if (/vice president|assistant secretary/i.test(pos)) return 3;
  if (/chairperson|chair\b|head\b|coordinator|adviser|director/i.test(pos)) return 2;
  if (/^member$|^associate$/i.test(pos.trim())) return 0;
  return 1;
}

const PALETTES: [string, string][] = [
  ['#7c2d12','#dc2626'],
  ['#1e3a8a','#4f6fd1'],
  ['#0f766e','#5eb5af'],
  ['#3b5fbc','#8aaae0'],
  ['#4a1d96','#7c3aed'],
  ['#064e3b','#10b981'],
  ['#78350f','#f59e0b'],
  ['#831843','#ec4899'],
];
function getGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  const [a, b] = PALETTES[h % PALETTES.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

/* ── Icons ── */
const IcoOut = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoCheck = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="5 12 10 17 19 7"/>
  </svg>
);
const IcoClock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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

/* ── Kiosk Officer Combobox — large touch-friendly version ── */
function KioskCombobox({
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

  useEffect(() => { if (!value) setSearch(''); }, [value]);

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
        className="kk-kiosk-input"
        type="text"
        value={search}
        placeholder={disabled ? 'Loading officers…' : 'Type your name…'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        onChange={(e) => { setSearch(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {open && (
        <div className="kk-kiosk-drop">
          {filtered.length === 0 ? (
            <div className="kk-kiosk-drop-empty">No matches found</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`kk-kiosk-drop-opt${value === o.id ? ' is-selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
              >
                <span className="kk-kiosk-drop-name">{o.full_name}</span>
                {o.displayPosition && (
                  <span className="kk-kiosk-drop-pos">{o.displayPosition}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
const RESET_SECONDS = 10;

export default function LogbookCheckoutKiosk() {
  /* ── Refs ── */
  const clockRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Officers ── */
  const [officers,        setOfficers]        = useState<Officer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  /* ── Form state ── */
  const [officerId,   setOfficerId]   = useState('');
  const [openSession, setOpenSession] = useState<OpenSession | null | undefined>(undefined);

  /* ── Phase / result ── */
  type Phase = 'form' | 'success';
  const [phase,        setPhase]        = useState<Phase>('form');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  /* ── Roster + clock ── */
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [now,      setNow]      = useState(() => new Date());

  /* ── Auto-reset countdown after success ── */
  const [resetIn, setResetIn] = useState(0);


  /* ── Officers fetch ── */
  useEffect(() => {
    Promise.allSettled([
      axios.get<RawOfficer[]>(`${API}/officers/`, { params: { status: 'active' } }),
      axios.get<Committee[]>(`${API}/committees/`),
    ]).then(([oRes, cRes]) => {
      if (oRes.status === 'rejected') return;
      const raw = oRes.value.data ?? [];
      const cmap = new Map<string, string>();
      if (cRes.status === 'fulfilled') {
        for (const c of (cRes.value.data ?? [])) cmap.set(String(c.id), c.name);
      }
      const best = new Map<string, { raw: RawOfficer; rank: number }>();
      for (const r of raw) {
        const parsed = parseFirstPosition(r.position ?? '');
        const rank   = rankPosition(parsed);
        const prev   = best.get(r.full_name);
        if (!prev || rank > prev.rank) best.set(r.full_name, { raw: r, rank });
      }
      const processed: Officer[] = Array.from(best.values())
        // Exclude advisers — they are faculty, not duty officers
        .filter(({ raw: r }) => !/adviser|advisor/i.test(r.position ?? ''))
        .map(({ raw: r }) => {
          const parsed     = parseFirstPosition(r.position ?? '');
          const commitName = r.committee ? (cmap.get(String(r.committee)) ?? null) : null;
          return {
            id:              r.id,
            full_name:       r.full_name,
            position:        r.position ?? '',
            displayPosition: /^member$|^associate$/i.test(parsed.trim()) && commitName
              ? `Member · ${commitName}`
              : parsed,
            committee_name: commitName,
          };
        });
      processed.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setOfficers(processed);
    }).finally(() => setOfficersLoading(false));
  }, []);

  /* ── Open-session lookup ── */
  useEffect(() => {
    if (!officerId) { setOpenSession(undefined); return; }
    let cancelled = false;
    setOpenSession(undefined); // reset to loading state
    axios
      .get<{ open_session: OpenSession | null }>(`${API}/logbook/status/${officerId}`)
      .then(({ data }) => { if (!cancelled) setOpenSession(data.open_session); })
      .catch(() => { if (!cancelled) setOpenSession(null); });
    return () => { cancelled = true; };
  }, [officerId]);

  /* ── Sessions + clock ── */
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await axios.get<SessionEntry[]>(`${API}/logbook/today`);
      setSessions(data);
    } catch { /* keep last */ }
  }, []);

  useEffect(() => {
    fetchSessions();
    sessionRef.current = setInterval(fetchSessions, 30_000);
    clockRef.current   = setInterval(() => setNow(new Date()), 1_000);
    return () => {
      if (sessionRef.current) clearInterval(sessionRef.current);
      if (clockRef.current)   clearInterval(clockRef.current);
    };
  }, [fetchSessions]);

  /* ── Auto-reset countdown ── */
  useEffect(() => {
    if (phase !== 'success') return;
    setResetIn(RESET_SECONDS);
    resetRef.current = setInterval(() => {
      setResetIn((n) => {
        if (n <= 1) {
          clearInterval(resetRef.current!);
          handleReset();
          return 0;
        }
        return n - 1;
      });
    }, 1_000);
    return () => { if (resetRef.current) clearInterval(resetRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Handlers ── */
  const handleReset = useCallback(() => {
    setPhase('form');
    setOfficerId('');
    setOpenSession(undefined);
    setError('');
    setCheckoutData(null);
    if (resetRef.current) clearInterval(resetRef.current);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!officerId) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/logbook/checkout`, { officer_id: officerId });
      const name = data.officer_name ?? officers.find((o) => o.id === officerId)?.full_name ?? '';
      setCheckoutData({
        officer_name: name,
        check_in_at:  data.session?.check_in_at ?? openSession?.check_in_at ?? '',
        check_out_at: data.session?.check_out_at ?? new Date().toISOString(),
      });
      setPhase('success');
      // Refresh roster immediately so the checked-out officer disappears
      fetchSessions();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Could not check out. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [officerId, officers, openSession, fetchSessions]);

  /* ── Derived values ── */
  const present = sessions.filter((s) => !s.check_out_at && !s.auto_checkout);

  /* ════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════ */
  return (
    <div className="kk-root kk-root--display">
      <div className="kk-display">
        <div className="kk-display-bg"/>

        {/* ── Header ── */}
        <div className="kk-display-head">
          <div className="kk-display-brand">
            <img src={logo} alt="CSG Logo" style={{ width: 'clamp(36px,4vw,56px)', height: 'clamp(36px,4vw,56px)', borderRadius: '50%', flexShrink: 0 }}/>
            <div className="kk-display-brand-text">
              <span className="kk-display-brand-name">CSG-OITS · Office Logbook</span>
              <span className="kk-display-brand-sub">Cavite State University — Imus</span>
            </div>
          </div>
          <div className="kk-display-clock">
            <div className="kk-display-time">{fmtClock(now)}</div>
            <div className="kk-display-date">{fmtDate(now)}</div>
          </div>
        </div>

        {/* ════════════════════ SUCCESS STATE ════════════════════ */}
        {phase === 'success' && checkoutData && (
          <div className="kk-co-success">
            <div className="kk-co-success-ico">
              <IcoCheck width={52} height={52}/>
            </div>
            <div className="kk-co-success-bye">Have a great rest of your day,</div>
            <div className="kk-co-success-name">{checkoutData.officer_name}</div>

            <div className="kk-co-success-summary">
              {checkoutData.check_in_at && (
                <div className="kk-co-success-row">
                  <span className="kk-co-sl">Checked in</span>
                  <span className="kk-co-sv">{fmtTimeFull(checkoutData.check_in_at)}</span>
                </div>
              )}
              <div className="kk-co-success-row">
                <span className="kk-co-sl">Checked out</span>
                <span className="kk-co-sv">{fmtTimeFull(checkoutData.check_out_at)}</span>
              </div>
              {checkoutData.check_in_at && (
                <div className="kk-co-success-row">
                  <span className="kk-co-sl">Time on duty</span>
                  <span className="kk-co-sv is-dur">
                    {durStr(checkoutData.check_in_at, checkoutData.check_out_at)}
                  </span>
                </div>
              )}
            </div>

            <div className="kk-co-reset-pill" onClick={handleReset}>
              Resetting in <strong>{resetIn}s</strong> — tap to reset now
            </div>
          </div>
        )}

        {/* ════════════════════ FORM STATE ════════════════════ */}
        {phase === 'form' && (
          <div className="kk-display-inner kk-co-inner">
            {/* ── Left: Checkout form ── */}
            <div className="kk-display-qr-col kk-co-form-col">
              <span className="kk-display-eyebrow">
                <span className="kk-co-eyebrow-dot"/>
                Checkout Station
              </span>
              <h1 className="kk-display-h1">
                Check <em>out</em>
              </h1>
              <p className="kk-display-sub">
                Select your name below, then tap <strong style={{ color: '#f1d27a' }}>Check out</strong>.
                No QR scan needed.
              </p>

              {/* Form card */}
              <div className="kk-co-form-card">
                {/* Officer combobox */}
                <div className="kk-co-field">
                  <label className="kk-co-field-lbl">Your name</label>
                  <KioskCombobox
                    officers={officers}
                    value={officerId}
                    onChange={(id) => { setOfficerId(id); setError(''); }}
                    disabled={officersLoading}
                  />
                </div>

                {/* Open session summary */}
                {officerId && openSession && (
                  <div className="kk-co-session-row">
                    <div className="kk-co-session-dot"/>
                    <div className="kk-co-session-body">
                      <span className="kk-co-session-lbl">Open session</span>
                      <span className="kk-co-session-val">
                        Since {fmtTimeFull(openSession.check_in_at)}
                        <span className="kk-co-session-dur">
                          · {durStr(openSession.check_in_at)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* No-session notice */}
                {officerId && openSession === null && (
                  <div className="kk-co-no-session">
                    <IcoWarn width={18} height={18}/>
                    <span>No open session found today — already checked out?</span>
                  </div>
                )}

                {/* Loading notice */}
                {officerId && openSession === undefined && (
                  <div className="kk-co-session-loading">Looking up session…</div>
                )}

                {/* Error */}
                {error && <div className="kk-co-error">{error}</div>}

                {/* Checkout button */}
                <button
                  className="kk-co-checkout-btn"
                  disabled={submitting || !officerId || !openSession}
                  onClick={handleCheckout}
                >
                  {submitting ? (
                    'Checking out…'
                  ) : (
                    <>
                      <IcoOut width={22} height={22}/>
                      Check out now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Right: Roster ── */}
            <div className="kk-display-side">
              <div className="kk-roster-card">
                <div className="kk-roster-head">
                  <span className="kk-roster-eyebrow">
                    <span className="kk-display-eyebrow-dot"/>
                    On duty now
                  </span>
                  <span className="kk-roster-count">{present.length}</span>
                </div>

                {present.length === 0 ? (
                  <div className="kk-roster-empty">
                    <IcoClock width={22} height={22}/>
                    <div>No officers checked in yet</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      Scan the check-in QR to start a session.
                    </div>
                  </div>
                ) : (
                  <div className="kk-roster-list">
                    {present.map((s) => {
                      const officer = s.officer;
                      if (!officer) return null;
                      return (
                        <div className="kk-roster-row" key={s.id}>
                          <span
                            className="kk-roster-avatar"
                            style={{ background: getGradient(officer.id) }}
                          >
                            {getInits(officer.full_name)}
                          </span>
                          <div className="kk-roster-body">
                            <span className="kk-roster-name">{officer.full_name}</span>
                            <span className="kk-roster-pos">{officer.position}</span>
                          </div>
                          <span className="kk-roster-dur">{durStr(s.check_in_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hint card linking back to check-in */}
              <a
                href="/logbook/display"
                className="kk-checkout-card"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <span className="kk-checkout-ico" style={{ background: 'rgba(241,210,122,0.12)', color: '#f1d27a' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </span>
                <div className="kk-checkout-body">
                  <span className="kk-checkout-lbl">Checking in?</span>
                  <span className="kk-checkout-val">Scan the QR code instead</span>
                  <span className="kk-checkout-val-url">Visit the check-in display</span>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
