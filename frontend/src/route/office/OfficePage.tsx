/**
 * OfficePage — /office
 *
 * Public page showing live CSG office attendance derived from open logbook sessions.
 * Design: PublicOfficeHours from public-office-hours-variants.jsx
 * Nav + footer provided by RootLayout — not rendered here.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './office.css';

const API = import.meta.env.VITE_API_URL as string;

/* ─── Types ──────────────────────────────────────────────── */
interface OfficerInfo {
  id:                   string;
  full_name:            string;
  position:             string;
  avatar_url:           string | null;
  committee_id:         number | null;
  committee_name:       string | null;
  is_committee_official: boolean;
}

interface LogbookEntry {
  id:            string;
  check_in_at:   string;
  check_out_at:  string | null;
  auto_checkout: boolean;
  officer:       OfficerInfo | null;
}

interface DayHours {
  day:   string;
  open:  string | null;
  close: string | null;
}

const DEFAULT_OFFICE_HOURS: DayHours[] = [
  { day: 'Monday',    open: '08:00', close: '19:00' },
  { day: 'Tuesday',   open: '08:00', close: '19:00' },
  { day: 'Wednesday', open: '08:00', close: '19:00' },
  { day: 'Thursday',  open: '08:00', close: '19:00' },
  { day: 'Friday',    open: '08:00', close: '19:00' },
  { day: 'Saturday',  open: '08:00', close: '19:00' },
  { day: 'Sunday',    open: null,    close: null     },
];

function fmt24to12(time: string | null): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0
    ? `${h12}:00 ${period}`
    : `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

function getInitials(name: string): string {
  return name.split(/[\s._@]+/).slice(0, 2).map((s) => s[0] ?? '').join('').toUpperCase();
}

const GRADIENTS: [string, string][] = [
  ['#7c2d12', '#dc2626'],
  ['#1e3a8a', '#4f6fd1'],
  ['#475569', '#94a3b8'],
  ['#0f766e', '#5eb5af'],
  ['#92400e', '#a87c2d'],
  ['#3b5fbc', '#8aaae0'],
  ['#7c2d12', '#ea580c'],
  ['#1e293b', '#475569'],
  ['#15803d', '#22c55e'],
  ['#4338ca', '#818cf8'],
];

function getGradient(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function durMin(checkIn: string, checkOut: string | null): number {
  const end = checkOut ? new Date(checkOut) : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(checkIn).getTime()) / 60_000));
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ─── Day-of-week for office hours highlight ─────────────── */
const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayDow = new Date().getDay(); // 0=Sun

/* ─── Avatar (88px, for On Duty Now cards) ───────────────── */
function NowAvatar({ officer }: { officer: OfficerInfo }) {
  const [imgErr, setImgErr] = useState(false);
  const [c1, c2] = getGradient(officer.id);
  if (officer.avatar_url && !imgErr) {
    return (
      <span className="oh-now-avatar">
        <img src={officer.avatar_url} alt={officer.full_name} onError={() => setImgErr(true)} />
      </span>
    );
  }
  return (
    <span className="oh-now-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {getInitials(officer.full_name)}
    </span>
  );
}

/* ─── Avatar (40px, for Earlier Today rows) ─────────────── */
function EarlierAvatar({ officer }: { officer: OfficerInfo }) {
  const [imgErr, setImgErr] = useState(false);
  const [c1, c2] = getGradient(officer.id);
  if (officer.avatar_url && !imgErr) {
    return (
      <span className="oh-earlier-avatar">
        <img src={officer.avatar_url} alt={officer.full_name} onError={() => setImgErr(true)} />
      </span>
    );
  }
  return (
    <span className="oh-earlier-avatar" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {getInitials(officer.full_name)}
    </span>
  );
}

/* ─── Icons ──────────────────────────────────────────────── */
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const FbIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.9h-2.34v6.98A10 10 0 0 0 22 12Z"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10"/>
  </svg>
);

/* ─── Main page ──────────────────────────────────────────── */
export default function OfficePage() {
  const [sessions,     setSessions]     = useState<LogbookEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState<Date>(new Date());
  const [tick,         setTick]         = useState(0); // forces duration re-render
  const [officeLat,    setOfficeLat]    = useState<string | null>(null);
  const [officeLng,    setOfficeLng]    = useState<string | null>(null);
  const [officeHours,  setOfficeHours]  = useState<DayHours[]>(DEFAULT_OFFICE_HOURS);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await axios.get<LogbookEntry[]>(`${API}/logbook/today`);
      setSessions(data);
      setLastRefresh(new Date());
    } catch {
      // keep last data on poll failure
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch + poll every 60s */
  useEffect(() => {
    fetchToday();
    const pollId = setInterval(fetchToday, 60_000);
    return () => clearInterval(pollId);
  }, [fetchToday]);

  /* Fetch office coords + hours from settings */
  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API}/settings/logbook_lat`),
      axios.get(`${API}/settings/logbook_lng`),
      axios.get(`${API}/settings/office_hours`),
    ]).then(([latR, lngR, ohR]) => {
      if (latR.status === 'fulfilled') setOfficeLat(latR.value.data.value ?? null);
      if (lngR.status === 'fulfilled') setOfficeLng(lngR.value.data.value ?? null);
      if (ohR.status === 'fulfilled' && ohR.value.data.value) {
        try {
          const parsed = JSON.parse(ohR.value.data.value);
          if (Array.isArray(parsed) && parsed.length > 0) setOfficeHours(parsed);
        } catch { /* keep defaults */ }
      }
    });
  }, []);

  /* Tick every 60s so live durations stay fresh */
  useEffect(() => {
    tickRef.current = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);
  void tick; // suppress unused-var warning

  /* Deduplicate by officer name — an officer can hold multiple roles
     (e.g. VP of Internal Affairs + RIAC Chairperson). Show only one card
     per person, preferring the CSG-wide role (is_committee_official = false)
     over a committee role so the highest position is always displayed. */
  const dedup = (list: typeof sessions) => {
    const seen = new Map<string, typeof sessions[0]>();
    for (const s of list) {
      const name = s.officer?.full_name;
      if (!name) continue;
      const existing = seen.get(name);
      if (!existing) { seen.set(name, s); continue; }
      // Replace if existing is a committee role and incoming is a CSG-wide role
      const existingIsCommittee = existing.officer?.is_committee_official ?? true;
      const incomingIsCommittee = s.officer?.is_committee_official ?? true;
      if (existingIsCommittee && !incomingIsCommittee) seen.set(name, s);
    }
    return [...seen.values()];
  };

  const present = sessions.filter((s) => !s.check_out_at);
  const dedupPresent = dedup(present);

  /* Exclude from "Earlier Today" any officer who is currently checked in.
     An officer may have accidentally checked out and then re-checked in —
     showing them in both sections would be redundant. Their latest open
     session is the authoritative one; the accidental checkout is hidden. */
  const presentNames = new Set(
    dedupPresent.map((s) => s.officer?.full_name).filter((n): n is string => Boolean(n)),
  );
  const earlier = sessions.filter(
    (s) => !!s.check_out_at && !presentNames.has(s.officer?.full_name ?? ''),
  );
  const dedupEarlier = dedup(earlier);
  const isClosed = !loading && dedupPresent.length === 0;
  const count = dedupPresent.length;

  /* Google Maps — use saved coords if available, fall back to address search */
  const hasCoords = officeLat && officeLng
    && !isNaN(parseFloat(officeLat)) && !isNaN(parseFloat(officeLng));
  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${officeLat},${officeLng}&z=18&output=embed&iwloc=&maptype=roadmap`
    : `https://maps.google.com/maps?q=Cavite+State+University+Imus+Campus&z=17&output=embed&iwloc=&maptype=roadmap`;
  const mapsLink = hasCoords
    ? `https://maps.google.com/maps?q=${officeLat},${officeLng}&z=18`
    : `https://maps.google.com/maps?q=Cavite+State+University+Imus+Campus`;

  /* "just now" vs time */
  const refreshLabel = (() => {
    const diffSec = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diffSec < 30) return 'just now';
    return lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  })();

  return (
    <div className="oh-root">
      {/* ── Hero ── */}
      <section className="oh-hero">
        <div className="oh-hero-bg" />
        <div className="oh-hero-inner">
          <div>
            <span className="oh-eyebrow">
              <span className={`oh-eyebrow-dot${isClosed ? ' is-off' : ''}`} />
              {isClosed ? 'Office hours · Closed right now' : 'Office hours · Live'}
            </span>
            <h1>
              {isClosed ? (
                <>The CSG office is <em>closed</em> right now.</>
              ) : (
                <>Drop by — <em>{count}</em> officer{count !== 1 ? 's' : ''} {count === 1 ? 'is' : 'are'} in the CSG office right <em>now</em>.</>
              )}
            </h1>
            <p>
              {isClosed
                ? 'No officers are currently checked in. The office is staffed Monday through Saturday — see our usual hours below, or reach us by email or Facebook in the meantime.'
                : "Officers check in and out using the QR code at our office door. This page updates live so you can tell who's around before you make the trip."
              }
            </p>
            <div className="oh-hero-meta">
              <RefreshIcon />
              <span>Updated <strong>{refreshLabel}</strong></span>
              <span className="oh-hero-meta-divider" />
              <span>Auto-refreshes every <strong>60s</strong></span>
            </div>
          </div>

          <div className="oh-counter">
            <div className="oh-counter-head">
              <span className={`oh-counter-status${isClosed ? ' is-closed' : ''}`}>
                {isClosed ? '○ Closed' : '● Open'}
              </span>
              <div className="oh-counter-num">
                <span className="oh-counter-num-big">{loading ? '…' : count}</span>
                <span className="oh-counter-num-lbl">
                  officer{count === 1 ? '' : 's'}<br />on duty
                </span>
              </div>
            </div>

            {isClosed ? (
              <div className="oh-counter-sub">
                <strong>No one</strong> is checked in right now.
              </div>
            ) : (
              /* Inline roster — fills the whitespace with useful who's-here info */
              <div className="oh-counter-roster">
                {dedupPresent.map((s) => {
                  if (!s.officer) return null;
                  const [c1, c2] = getGradient(s.officer.id);
                  const dur = fmtDur(durMin(s.check_in_at, null));
                  return (
                    <div key={s.id} className="oh-counter-roster-row">
                      <span
                        className="oh-counter-roster-av"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                      >
                        {getInitials(s.officer.full_name)}
                      </span>
                      <div className="oh-counter-roster-body">
                        <span className="oh-counter-roster-name">{s.officer.full_name}</span>
                        <span className="oh-counter-roster-pos">{s.officer.position}</span>
                      </div>
                      <span className="oh-counter-roster-dur">{dur}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── On Duty Now ── */}
      {isClosed ? (
        <section className="oh-section">
          <div className="oh-section-head">
            <div>
              <div className="oh-section-kicker">On duty now</div>
              <h2>No one&rsquo;s in the office <em>at the moment</em></h2>
              <p>The QR check-in board hasn&rsquo;t logged anyone in. That usually means the office is in between staffed hours.</p>
            </div>
          </div>
          <div className="oh-empty">
            <span className="oh-empty-ico"><MoonIcon /></span>
            <h3>The office is <em>quiet</em> right now</h3>
            <p>Officers typically check in between 8 AM and 7 PM on weekdays and Saturdays. If something can&rsquo;t wait, you can still reach us using the contact methods below.</p>
            <span className="oh-empty-hint">
              <ClockIcon />
              Office <strong>hours: Mon–Sat, 8 AM – 7 PM</strong>
            </span>
          </div>
        </section>
      ) : (
        <section className="oh-section">
          <div className="oh-section-head">
            <div>
              <div className="oh-section-kicker">
                <span className="oh-eyebrow-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2.5px rgba(34,197,94,0.22)' }} />
                On duty now
              </div>
              <h2>Who&rsquo;s in the office <em>right now</em></h2>
              <p>These officers are currently checked in at the CSG office. Stop by to ask a question, file a concern, or just say hi.</p>
            </div>
            <span className="oh-section-meta">
              <ClockIcon />
              As of {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })},{' '}
              {lastRefresh.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="oh-now-grid">
            {dedupPresent.map((s) => {
              const officer = s.officer;
              if (!officer) return null;
              const dur = fmtDur(durMin(s.check_in_at, null));
              return (
                <article className="oh-now-card" key={s.id}>
                  <span className="oh-now-card-live">In office</span>
                  <NowAvatar officer={officer} />
                  <div className="oh-now-name">{officer.full_name}</div>
                  <div className="oh-now-pos">{officer.position}</div>
                  {officer.committee_name && (
                    <div className="oh-now-committee">{officer.committee_name}</div>
                  )}
                  <div className="oh-now-divider" />
                  <span className="oh-now-since">Checked in {fmtTime(s.check_in_at)}</span>
                  <span className="oh-now-duration">{dur}</span>
                  <span className="oh-now-time">and still here</span>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Earlier Today ── */}
      {dedupEarlier.length > 0 && (
        <section className="oh-section">
          <div className="oh-section-head">
            <div>
              <div className="oh-section-kicker">Earlier today</div>
              <h2>Was here today, has since <em>checked out</em></h2>
              <p>Sessions that already closed today. We keep the day&rsquo;s history visible so you can see typical traffic.</p>
            </div>
            <span className="oh-section-meta">{dedupEarlier.length} closed session{dedupEarlier.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="oh-earlier-card">
            {dedupEarlier.map((s) => {
              const officer = s.officer;
              if (!officer) return null;
              const dur = fmtDur(durMin(s.check_in_at, s.check_out_at));
              return (
                <div className="oh-earlier-row" key={s.id}>
                  <EarlierAvatar officer={officer} />
                  <div className="oh-earlier-name">
                    <strong>{officer.full_name}</strong>
                    <span>{officer.position}{officer.committee_name ? ` · ${officer.committee_name}` : ''}</span>
                  </div>
                  <div className="oh-earlier-times">
                    <span>{fmtTime(s.check_in_at)}</span>
                    <span className="oh-earlier-arrow">→</span>
                    <span>{s.check_out_at ? fmtTime(s.check_out_at) : '—'}</span>
                  </div>
                  <span className="oh-earlier-dur">{dur}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Info strip ── */}
      <section className="oh-section oh-section--last">
        <div className="oh-section-head">
          <div>
            <div className="oh-section-kicker">Find the office</div>
            <h2>Where we are &amp; <em>when</em> we&rsquo;re usually here</h2>
            <p>Live data above tells you who&rsquo;s in right now. Here are our usual hours and how to reach us if no one&rsquo;s around.</p>
          </div>
        </div>

        <div className="oh-info-grid">
          {/* Office hours */}
          <div className="oh-info-card">
            <span className="oh-info-card-ico"><ClockIcon /></span>
            <h3>Usual office hours</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              These are when officers typically staff the office. Actual presence shown live above.
            </p>
            <ul className="oh-hours-list">
              {officeHours.map(({ day, open, close }) => {
                const isToday = DOW_LABELS[todayDow] === day;
                const timeStr = open && close
                  ? `${fmt24to12(open)} — ${fmt24to12(close)}`
                  : null;
                return (
                  <li key={day}>
                    <span className="day">
                      {day}
                      {isToday && <span className="oh-hours-now">Today</span>}
                    </span>
                    {timeStr
                      ? <span className="time">{timeStr}</span>
                      : <span className="closed">Closed</span>
                    }
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Location + contact */}
          <div className="oh-info-card">
            <span className="oh-info-card-ico"><PinIcon /></span>
            <h3>CSG Office</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Old Building, 2nd Floor. Cavite State University — Imus Campus, Palico IV, Imus, Cavite.
            </p>
            <div className="oh-map" aria-label="Office location map">
              <iframe
                src={mapSrc}
                title="CSG Office location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a
              className="oh-map-open-link"
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps ↗
            </a>
            <div className="oh-contact-grid">
              <button
                type="button"
                className="oh-contact-pill"
                onClick={() =>
                  window.open(
                    'https://mail.google.com/mail/?view=cm&to=csg.imus@cvsu.edu.ph',
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <span className="ico"><MailIcon /></span>
                <span className="meta">
                  <span className="meta-lbl">Email</span>
                  <span className="meta-val">csg.imus@cvsu.edu.ph</span>
                </span>
              </button>
              <a className="oh-contact-pill" href="https://www.facebook.com/csg.imus" target="_blank" rel="noopener noreferrer">
                <span className="ico"><FbIcon /></span>
                <span className="meta">
                  <span className="meta-lbl">Facebook</span>
                  <span className="meta-val">/csg.imus</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
