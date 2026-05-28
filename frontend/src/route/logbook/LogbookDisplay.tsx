/**
 * LogbookDisplay — /logbook/display
 *
 * Standalone kiosk page shown on the screen inside the CSG office.
 * Fetches a rotating QR token (IP-gated) and renders the QR officers scan
 * to check in. Also shows who is currently checked in today.
 *
 * Auto-refreshes the token every `expires_in` seconds.
 * Auto-refreshes the present-list every 30 seconds.
 * Clock updates every second.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import logo from '../../assets/CSG_logo.svg';
import './kiosk.css';

const API      = import.meta.env.VITE_API_URL as string;
const FRONTEND = (import.meta.env.VITE_FRONTEND_URL as string | undefined)
  ?? window.location.origin;

/* ── Types ── */
interface TokenData {
  token:          string;
  expires_in:     number;
  window_seconds: number;
}

interface SessionEntry {
  id:           string;
  check_in_at:  string;
  check_out_at: string | null;
  auto_checkout: boolean;
  officer: {
    id:             string;
    full_name:      string;
    position:       string;
    committee_name: string | null;
  } | null;
}

/* ── Helpers ── */
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmtTime(d: Date): string {
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 || 12;
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}
function fmtDate(d: Date): string {
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function durStr(checkInAt: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(checkInAt).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function getInits(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
}

const PALETTES: [string, string][] = [
  ['#7c2d12', '#dc2626'],
  ['#1e3a8a', '#4f6fd1'],
  ['#0f766e', '#5eb5af'],
  ['#3b5fbc', '#8aaae0'],
  ['#4a1d96', '#7c3aed'],
  ['#064e3b', '#10b981'],
  ['#78350f', '#f59e0b'],
  ['#831843', '#ec4899'],
];
function getGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  const [a, b] = PALETTES[h % PALETTES.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}


/* ── Icons ── */
const IcoRefresh = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10"/>
  </svg>
);
const IcoClock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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
const IcoWarn = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ── Main component ── */
export default function LogbookDisplay() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [sessions, setSessions]     = useState<SessionEntry[]>([]);
  const [countdown, setCountdown]   = useState(0);
  const [now, setNow]               = useState(() => new Date());

  const tokenTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayRef      = useRef<HTMLDivElement>(null);

  /* ── Viewport scaling — keeps the 1920×1080 canvas fitted to any window ── */
  useEffect(() => {
    const scaleDisplay = () => {
      if (!displayRef.current) return;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const left  = (window.innerWidth  - 1920 * scale) / 2;
      const top   = (window.innerHeight - 1080 * scale) / 2;
      displayRef.current.style.transform = `scale(${scale})`;
      displayRef.current.style.left      = `${left}px`;
      displayRef.current.style.top       = `${top}px`;
    };
    scaleDisplay();
    window.addEventListener('resize', scaleDisplay);
    return () => window.removeEventListener('resize', scaleDisplay);
  }, []);

  /* ── Token fetch ── */
  const fetchToken = useCallback(async () => {
    try {
      const { data } = await axios.get<TokenData>(`${API}/logbook/qr-token`);
      setTokenData(data);
      setTokenError('');
      setCountdown(data.expires_in);

      if (tokenTimerRef.current) clearTimeout(tokenTimerRef.current);
      tokenTimerRef.current = setTimeout(fetchToken, data.expires_in * 1000);

      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(
        () => setCountdown((c) => Math.max(0, c - 1)),
        1000,
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ?? 'Unable to load QR token.';
      setTokenError(msg);
    }
  }, []);

  /* ── Sessions fetch ── */
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await axios.get<SessionEntry[]>(`${API}/logbook/today`);
      setSessions(data);
    } catch {
      /* keep last known data */
    }
  }, []);

  useEffect(() => {
    fetchToken();
    fetchSessions();

    sessionTimerRef.current = setInterval(fetchSessions, 30_000);
    clockRef.current        = setInterval(() => setNow(new Date()), 1_000);

    return () => {
      if (tokenTimerRef.current)   clearTimeout(tokenTimerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (countdownRef.current)    clearInterval(countdownRef.current);
      if (clockRef.current)        clearInterval(clockRef.current);
    };
  }, [fetchToken, fetchSessions]);

  /* ── Derived values ── */
  const checkinUrl  = tokenData ? `${FRONTEND}/logbook?token=${tokenData.token}` : '';
  const checkoutUrl = `${FRONTEND}/logbook?action=checkout`;
  const present     = sessions.filter((s) => !s.check_out_at && !s.auto_checkout);
  const windowSecs  = tokenData?.window_seconds ?? 300;
  const barPct      = windowSecs > 0
    ? ((countdown / windowSecs) * 100).toFixed(1)
    : '0';

  const fmtCountdown = (() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  })();

  /* ── IP-gate error — full-screen in kiosk style ── */
  if (tokenError) {
    return (
      <div className="kk-root kk-root--display">
        <div className="kk-display" ref={displayRef}>
          <div className="kk-display-bg"/>
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
            color: '#fff', textAlign: 'center',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <IcoWarn width={40} height={40} style={{ opacity: 0.8 }}/>
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em' }}>
              Display not available
            </div>
            <div style={{ fontSize: 20, opacity: 0.7, maxWidth: 540, lineHeight: 1.55 }}>
              {tokenError}
            </div>
            <button
              onClick={fetchToken}
              style={{
                marginTop: 16,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 28px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (!tokenData) {
    return (
      <div className="kk-root kk-root--display">
        <div className="kk-display" ref={displayRef}>
          <div className="kk-display-bg"/>
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', fontSize: 22,
          }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  /* ── Main kiosk layout ── */
  return (
    <div className="kk-root kk-root--display">
      <div className="kk-display" ref={displayRef}>
        <div className="kk-display-bg"/>

        {/* ── Header ── */}
        <div className="kk-display-head">
          <div className="kk-display-brand">
            <img src={logo} alt="CSG Logo" width={56} height={56} style={{ borderRadius: '50%' }}/>
            <div className="kk-display-brand-text">
              <span className="kk-display-brand-name">CSG-OITS · Office Logbook</span>
              <span className="kk-display-brand-sub">Cavite State University — Imus</span>
            </div>
          </div>
          <div className="kk-display-clock">
            <div className="kk-display-time">{fmtTime(now)}</div>
            <div className="kk-display-date">{fmtDate(now)}</div>
          </div>
        </div>

        <div className="kk-display-inner">
          {/* ── Left: QR ── */}
          <div className="kk-display-qr-col">
            <span className="kk-display-eyebrow">
              <span className="kk-display-eyebrow-dot"/>
              Live · Office is open
            </span>
            <h1 className="kk-display-h1">
              Scan to <em>check in</em>
            </h1>
            <p className="kk-display-sub">
              Hold your phone&rsquo;s camera over the QR code. You&rsquo;ll be prompted to
              confirm your name and student number.
            </p>
            <div className="kk-qr-card">
              {/* Clicking the QR opens the check-in form in a new tab —
                  useful when an officer is at the kiosk and can't scan. */}
              <a
                href={checkinUrl}
                className="kk-qr-link"
                title="Tap to open check-in form on this screen"
                aria-label="Open check-in form"
                onClick={(e) => { e.preventDefault(); window.open(checkinUrl, '_blank'); }}
              >
                <QRCode
                  value={checkinUrl}
                  size={420}
                  className="kk-qr-img"
                  bgColor="#ffffff"
                  fgColor="#0f1729"
                />
              </a>
              <p className="kk-qr-tap-hint">
                Can&rsquo;t scan? <strong>Tap the QR</strong> to open on this screen.
              </p>
            </div>
            <div
              className="kk-qr-refresh"
              style={{ '--bar-pct': `${barPct}%` } as React.CSSProperties}
            >
              <IcoRefresh width={14} height={14}/>
              <span>
                QR rotates in{' '}
                <strong style={{ color: '#fff' }}>{fmtCountdown}</strong>
              </span>
              <span className="kk-qr-refresh-bar" aria-hidden="true"/>
            </div>
          </div>

          {/* ── Right: Roster + Checkout hint ── */}
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
                    Be the first — scan the QR.
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
                        {/* now state ensures this re-renders every second */}
                        <span className="kk-roster-dur">
                          {durStr(s.check_in_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <a
              href={checkoutUrl}
              className="kk-checkout-card"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <span className="kk-checkout-ico">
                <IcoOut width={22} height={22}/>
              </span>
              <div className="kk-checkout-body">
                <span className="kk-checkout-lbl">Checking out?</span>
                <span className="kk-checkout-val">Tap here to check out</span>
                <span className="kk-checkout-val-url">No QR scan needed</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
