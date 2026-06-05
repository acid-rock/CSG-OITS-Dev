import '../_shared/admin-list.css';
import '../_shared/admin-settings.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PauseAccessModal from '../../components/modals/PauseAccessModal/PauseAccessModal';
import ChangelogModal from '../../components/modals/changelogModal/ChangelogModal';
import Sidebar from '../_shared/Sidebar';

const API_URL = import.meta.env.VITE_API_URL as string;

// ── Inline SVG icon helpers ──────────────────────────────────────────────────
type SvgP = React.SVGProps<SVGSVGElement>;

const CogIcon    = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
const UserIcon   = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ShieldIcon = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/></svg>;
const PinIcon    = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const KeyIcon    = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M16 8l3 3M14 10l3 3"/></svg>;
const InfoIcon   = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M11 12h1v5h1"/></svg>;
const ChevIcon   = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 18 15 12 9 6"/></svg>;
const AlertIcon  = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CopyIcon   = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const DocIcon    = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>;
const EyeIcon    = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const ClockIcon  = (p: SvgP) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ── Card wrapper ─────────────────────────────────────────────────────────────
interface StCardProps {
  glyph?: React.ReactNode;
  glyphTone?: 'default' | 'warn' | 'success' | 'danger';
  title: string;
  sub?: string;
  children: React.ReactNode;
}

function StCard({ glyph, glyphTone = 'default', title, sub, children }: StCardProps) {
  return (
    <section className="st-card">
      <div className="st-card-head">
        <div className="st-card-head-left">
          {glyph && (
            <span className={`st-card-glyph${glyphTone !== 'default' ? ` tone-${glyphTone}` : ''}`}>
              {glyph}
            </span>
          )}
          <div className="st-card-title">
            {title}
            {sub && <small>{sub}</small>}
          </div>
        </div>
      </div>
      <div className="st-card-body">{children}</div>
    </section>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminAccount {
  id: string;
  owner_id: string;
  role: string;
  email: string | null;
  full_name?: string | null;
}

interface CommitteePins {
  publication: string;
  secretariat: string;
  finance: string;
}

interface DayHours {
  day:   string;
  open:  string | null;
  close: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string | null | undefined): string {
  return (name ?? 'A')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';
}

// ── Geofence map helper ──────────────────────────────────────────────────────
function buildGeofenceMap(lat: number, lng: number, radiusM: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <script>
    var map = L.map('map', { scrollWheelZoom: false, zoomControl: true }).setView([${lat}, ${lng}], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([${lat}, ${lng}]).addTo(map);
    L.circle([${lat}, ${lng}], {
      radius: ${radiusM},
      color: '#4f6fd1',
      fillColor: '#4f6fd1',
      fillOpacity: 0.12,
      weight: 2
    }).addTo(map);
  <\/script>
</body>
</html>`;
}

// ── Office hours default ──────────────────────────────────────────────────────
const DEFAULT_OFFICE_HOURS: DayHours[] = [
  { day: 'Monday',    open: '08:00', close: '19:00' },
  { day: 'Tuesday',   open: '08:00', close: '19:00' },
  { day: 'Wednesday', open: '08:00', close: '19:00' },
  { day: 'Thursday',  open: '08:00', close: '19:00' },
  { day: 'Friday',    open: '08:00', close: '19:00' },
  { day: 'Saturday',  open: '08:00', close: '19:00' },
  { day: 'Sunday',    open: null,    close: null     },
];

// ── Component ────────────────────────────────────────────────────────────────
const Settings = () => {
  const [activeSection, setActiveSection] = useState('general');

  // Admin accounts
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Modals
  const [pauseModal, setPauseModal] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Pause access
  const [pause, setPause] = useState(false);
  const [pauseSaving, setPauseSaving] = useState(false);

  // Active term
  const [activeTerm, setActiveTerm] = useState('');
  const [termSelect, setTermSelect] = useState('');
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [termSaving, setTermSaving] = useState(false);
  const [termSaved, setTermSaved] = useState(false);

  // Current user (for security section identity badge)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string | null } | null>(null);

  // Logbook geo config
  const [geoLat,      setGeoLat]      = useState('');
  const [geoLng,      setGeoLng]      = useState('');
  const [geoRadius,   setGeoRadius]   = useState('');
  const [geoSaving,   setGeoSaving]   = useState(false);
  const [geoSaved,    setGeoSaved]    = useState(false);
  const [geoError,    setGeoError]    = useState('');
  // Saved coords — only update on successful save (drives the map preview)
  const [savedGeoLat,    setSavedGeoLat]    = useState('');
  const [savedGeoLng,    setSavedGeoLng]    = useState('');
  const [savedGeoRadius, setSavedGeoRadius] = useState('');

  // Office hours
  const [officeHours, setOfficeHours] = useState<DayHours[]>(DEFAULT_OFFICE_HOURS);
  const [ohSaving,    setOhSaving]    = useState(false);
  const [ohSaved,     setOhSaved]     = useState(false);
  const [ohError,     setOhError]     = useState('');
  // Tick every 60s while the office_hours section is open — keeps the countdown fresh
  const [nowMs,       setNowMs]       = useState(() => Date.now());
  useEffect(() => {
    if (activeSection !== 'office_hours') return;
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [activeSection]);

  // Committee PINs
  const [pins,       setPins]       = useState<CommitteePins>({ publication: '', secretariat: '', finance: '' });
  const [pinSaving,  setPinSaving]  = useState<Record<string, boolean>>({});
  const [pinSaved,   setPinSaved]   = useState<Record<string, boolean>>({});
  const [pinError,   setPinError]   = useState<Record<string, string>>({});
  const [pinVisible, setPinVisible] = useState<Record<string, boolean>>({});

  // Password change
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew,     setPwNew]     = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowCur, setPwShowCur] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowCon, setPwShowCon] = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErrors,  setPwErrors]  = useState<{ current?: string; new?: string; confirm?: string }>({});

  // ── Data loading ────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API_URL}/settings/access_paused`, { withCredentials: true })
      .then(({ data }) => setPause(data.value === 'true'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/settings/term`, { withCredentials: true })
      .then(({ data }) => { setActiveTerm(data.value ?? ''); setTermSelect(data.value ?? ''); })
      .catch(() => {});
    axios.get(`${API_URL}/officers/terms`, { withCredentials: true })
      .then(({ data }) => setTermOptions(Array.isArray(data) ? data : []))
      .catch(() => setTermOptions([]));
  }, []);

  useEffect(() => {
    axios.get<{ name: string; email: string; role: string }>(`${API_URL}/user/me`, { withCredentials: true })
      .then(({ data }) => setCurrentUser({ name: data.name ?? 'Admin', email: data.email ?? null }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API_URL}/settings/logbook_lat`,      { withCredentials: true }),
      axios.get(`${API_URL}/settings/logbook_lng`,      { withCredentials: true }),
      axios.get(`${API_URL}/settings/logbook_radius_m`, { withCredentials: true }),
    ]).then(([latR, lngR, radR]) => {
      const lat = latR.status === 'fulfilled' ? (latR.value.data.value ?? '') : '';
      const lng = lngR.status === 'fulfilled' ? (lngR.value.data.value ?? '') : '';
      setGeoLat(lat); setSavedGeoLat(lat);
      setGeoLng(lng); setSavedGeoLng(lng);
      if (radR.status === 'fulfilled') {
        const r = radR.value.data.value ?? '150';
        setGeoRadius(r);
        setSavedGeoRadius(r);
      }
    });
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/settings/office_hours`, { withCredentials: true })
      .then(({ data }) => {
        if (data.value) {
          try {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) setOfficeHours(parsed);
          } catch { /* keep defaults */ }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/committee-pins`, { withCredentials: true })
      .then(({ data }) => setPins({
        publication: data.publication ?? '',
        secretariat: data.secretariat ?? '',
        finance:     data.finance     ?? '',
      }))
      .catch(() => {});
  }, []);

  const fetchAdminAccounts = useCallback(async () => {
    setAdminLoading(true); setAdminError(null);
    try {
      const { data } = await axios.get(`${API_URL}/user/list`, { withCredentials: true });
      setAdminAccounts(data);
    } catch (err: unknown) {
      setAdminError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Could not load accounts.',
      );
    } finally { setAdminLoading(false); }
  }, []);

  useEffect(() => { fetchAdminAccounts(); }, [fetchAdminAccounts]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSaveTerm = async () => {
    if (!termSelect.trim()) return;
    setTermSaving(true); setTermSaved(false);
    try {
      await axios.post(`${API_URL}/settings/term`, { value: termSelect.trim() }, { withCredentials: true });
      setActiveTerm(termSelect.trim());
      setTermSaved(true);
      setTimeout(() => setTermSaved(false), 2500);
    } catch { /* silently ignore */ }
    finally { setTermSaving(false); }
  };

  const handlePauseConfirm = async () => {
    const next = !pause;
    setPauseSaving(true);
    try {
      await axios.post(`${API_URL}/settings/access_paused`, { value: String(next) }, { withCredentials: true });
      setPause(next);
    } catch { /* silently ignore */ }
    finally { setPauseSaving(false); }
  };

  const handleSaveGeo = async () => {
    setGeoSaving(true); setGeoSaved(false); setGeoError('');
    try {
      await Promise.all([
        axios.post(`${API_URL}/settings/logbook_lat`,      { value: geoLat.trim()    || '0'   }, { withCredentials: true }),
        axios.post(`${API_URL}/settings/logbook_lng`,      { value: geoLng.trim()    || '0'   }, { withCredentials: true }),
        axios.post(`${API_URL}/settings/logbook_radius_m`, { value: geoRadius.trim() || '150' }, { withCredentials: true }),
      ]);
      setSavedGeoLat(geoLat.trim() || '0');
      setSavedGeoLng(geoLng.trim() || '0');
      setSavedGeoRadius(geoRadius.trim() || '150');
      setGeoSaved(true);
      setTimeout(() => setGeoSaved(false), 2500);
    } catch { setGeoError('Failed to save. Please try again.'); }
    finally { setGeoSaving(false); }
  };

  const handleSaveOfficeHours = async () => {
    setOhSaving(true); setOhSaved(false); setOhError('');
    try {
      await axios.post(
        `${API_URL}/settings/office_hours`,
        { value: JSON.stringify(officeHours) },
        { withCredentials: true },
      );
      setOhSaved(true);
      setTimeout(() => setOhSaved(false), 2500);
    } catch { setOhError('Failed to save. Please try again.'); }
    finally { setOhSaving(false); }
  };

  const toggleOhDay = (idx: number) => {
    setOfficeHours((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        return row.open === null
          ? { ...row, open: '08:00', close: '19:00' }
          : { ...row, open: null, close: null };
      }),
    );
  };

  const updateOhDay = (idx: number, field: 'open' | 'close', value: string) => {
    setOfficeHours((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleSavePin = async (role: 'publication' | 'secretariat' | 'finance') => {
    const pin = pins[role].trim();
    if (!pin || pin.length < 8) {
      setPinError((e) => ({ ...e, [role]: 'PIN must be at least 8 characters.' }));
      return;
    }
    setPinSaving((s) => ({ ...s, [role]: true }));
    setPinSaved((s)  => ({ ...s, [role]: false }));
    setPinError((e)  => ({ ...e, [role]: '' }));
    try {
      await axios.post(`${API_URL}/committee-pins/${role}`, { pin }, { withCredentials: true });
      setPinSaved((s) => ({ ...s, [role]: true }));
      setTimeout(() => setPinSaved((s) => ({ ...s, [role]: false })), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to save PIN.';
      setPinError((e) => ({ ...e, [role]: msg }));
    } finally {
      setPinSaving((s) => ({ ...s, [role]: false }));
    }
  };

  const handleCopyPin = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
  };

  const handleChangePassword = async () => {
    const errs: { current?: string; new?: string; confirm?: string } = {};
    if (!pwCurrent) errs.current = 'Current password is required.';
    if (!pwNew) errs.new = 'New password is required.';
    else if (pwNew.length < 8) errs.new = 'Must be at least 8 characters.';
    if (!pwConfirm) errs.confirm = 'Please confirm your new password.';
    else if (pwConfirm !== pwNew) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true); setPwError(''); setPwSuccess(false);
    try {
      await axios.post(`${API_URL}/user/change-password`, {
        current_password: pwCurrent,
        new_password:     pwNew,
        confirm_password: pwConfirm,
      }, { withCredentials: true });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setPwSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to change password.';
      setPwError(msg);
    } finally { setPwSaving(false); }
  };

  const handleCancelPassword = () => {
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setPwErrors({}); setPwError(''); setPwSuccess(false);
    setPwShowCur(false); setPwShowNew(false); setPwShowCon(false);
  };

  // ── Nav definition ───────────────────────────────────────────────────────
  const navGroups = [
    {
      group: 'Account',
      items: [
        { id: 'general',  label: 'General',          icon: <CogIcon    width="15" height="15" /> },
        { id: 'admins',   label: 'Admin accounts',   icon: <UserIcon   width="15" height="15" />, hint: adminAccounts.length > 0 ? String(adminAccounts.length) : undefined },
        { id: 'security', label: 'Account security', icon: <ShieldIcon width="15" height="15" /> },
      ],
    },
    {
      group: 'Modules',
      items: [
        { id: 'logbook',      label: 'Office location', icon: <PinIcon   width="15" height="15" /> },
        { id: 'office_hours', label: 'Office hours',    icon: <ClockIcon width="15" height="15" /> },
        { id: 'pins',         label: 'Committee PINs',  icon: <KeyIcon   width="15" height="15" />, hint: '3' },
      ],
    },
    {
      group: 'System',
      items: [
        { id: 'about', label: 'About', icon: <InfoIcon width="15" height="15" /> },
      ],
    },
  ];

  const PIN_CARDS = [
    { role: 'publication' as const, name: 'Publication', scope: 'Announcements · Events' },
    { role: 'secretariat' as const, name: 'Secretariat', scope: 'Documents' },
    { role: 'finance'     as const, name: 'Finance',     scope: 'Equipment · Finance' },
  ];

  return (
    <div className="ad-shell">
      <Sidebar active="settings" />

      <main className="ad-main">
        <div className="st-page">

          {/* ── Page header ──────────────────────────────────────────── */}
          <header className="st-page-head">
            <div>
              <h1>Settings</h1>
              <p>Term-level defaults, access controls, admin accounts, and module configuration.</p>
            </div>
            {activeTerm && (
              <span className="st-meta-pill">
                <span className="st-meta-pill-glyph">T</span>
                Term&nbsp;<strong>{activeTerm}</strong>&nbsp;
                <span style={{ color: 'var(--color-text-muted)' }}>·&nbsp;</span>
                <span className="st-meta-dot" />active
              </span>
            )}
          </header>

          {/* ── Two-pane layout ──────────────────────────────────────── */}
          <div className="st-twopane">

            {/* ── Nav rail ── */}
            <aside className="st-nav">
              {navGroups.map((g) => (
                <div key={g.group}>
                  <div className="st-nav-group">{g.group}</div>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      className={`st-nav-link${activeSection === item.id ? ' is-active' : ''}`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.hint != null && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--color-text-hint)' }}>
                          {item.hint}
                        </span>
                      )}
                      <ChevIcon width="13" height="13" className="st-nav-chev" />
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            {/* ── Content pane ── */}
            <div className="st-pane">

              {/* ── GENERAL ── */}
              {activeSection === 'general' && (
                <StCard
                  glyph={<CogIcon width="16" height="16" />}
                  title="General"
                  sub="System-wide defaults and access state"
                >
                  <div className="st-stack">

                    {/* Administration term */}
                    <div className="st-field-row">
                      <div className="st-field-row-label">
                        <strong>Administration term</strong>
                        <span>Default school year applied to officers, documents, finance.</span>
                      </div>
                      <div className="st-field">
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            className="st-select"
                            value={termSelect}
                            onChange={(e) => setTermSelect(e.target.value)}
                            style={{ maxWidth: 220 }}
                          >
                            <option value="">Select a term year…</option>
                            {activeTerm && !termOptions.includes(activeTerm) && (
                              <option value={activeTerm}>{activeTerm} — current</option>
                            )}
                            {termOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}{t === activeTerm ? ' — current' : ''}
                              </option>
                            ))}
                          </select>
                          {activeTerm && (
                            <span className="st-meta-pill" style={{ padding: '4px 12px 4px 8px' }}>
                              <span className="st-meta-dot" />
                              <strong>{activeTerm}</strong>&nbsp;active
                            </span>
                          )}
                        </div>
                        <div className="st-field-hint">
                          Officers must have{' '}
                          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11.5px' }}>
                            year_serving
                          </code>{' '}
                          set for a term to appear here.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                          <button
                            className="st-btn st-btn-primary"
                            onClick={handleSaveTerm}
                            disabled={termSaving || !termSelect.trim() || termSelect.trim() === activeTerm}
                          >
                            {termSaving ? 'Saving…' : 'Save term'}
                          </button>
                          {termSaved && (
                            <span style={{ fontSize: 12, color: 'var(--color-success-text)' }}>✓ Saved</span>
                          )}
                        </div>
                        {termOptions.length === 0 && (
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            No term years available. Assign <em>year_serving</em> to officers first.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pause access toggle */}
                    <div className="st-field-row">
                      <div className="st-field-row-label">
                        <strong>Pause access for students</strong>
                        <span>Shows a maintenance screen on the public site. Admins stay open.</span>
                      </div>
                      <div className="st-row-control">
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {pauseSaving ? 'Saving…' : pause ? 'Paused' : 'Live'}
                        </span>
                        <button
                          className={`st-toggle${pause ? ' is-on' : ''}`}
                          onClick={() => setPauseModal(true)}
                          aria-pressed={pause}
                        />
                      </div>
                    </div>
                  </div>
                </StCard>
              )}

              {/* ── ADMIN ACCOUNTS ── */}
              {activeSection === 'admins' && (
                <StCard
                  glyph={<UserIcon width="16" height="16" />}
                  title="Admin accounts"
                  sub="Who can sign into the admin panel"
                >
                  {adminLoading ? (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading accounts…</p>
                  ) : adminError ? (
                    <p style={{ fontSize: 13, color: 'var(--color-danger-text)', margin: 0 }}>{adminError}</p>
                  ) : (
                    <table className="st-admin-list" style={{ margin: '-18px -18px 0' }}>
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Role</th>
                          <th style={{ textAlign: 'right' }}>&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAccounts.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)', fontSize: 13 }}
                            >
                              No admin accounts found.
                            </td>
                          </tr>
                        )}
                        {adminAccounts.map((acct) => {
                          const isSelf = currentUser?.email != null && currentUser.email === acct.email;
                          return (
                            <tr key={acct.id} className={isSelf ? 'is-self' : ''}>
                              <td>
                                <div className="st-admin-user">
                                  <span className="st-admin-avatar">
                                    {initials(acct.full_name ?? acct.email)}
                                  </span>
                                  <div className="st-admin-meta">
                                    <strong>
                                      {acct.full_name ?? acct.email ?? '—'}
                                      {isSelf && <span className="st-self-tag">You</span>}
                                    </strong>
                                    <small>{acct.email ?? '—'}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`st-role-tag role-${acct.role === 'super' ? 'super' : 'admin'}`}>
                                  {acct.role === 'super' ? 'Super admin' : 'Admin'}
                                </span>
                              </td>
                              <td className="is-right">
                                {isSelf ? (
                                  <button
                                    className="st-btn st-btn-ghost st-btn-sm"
                                    disabled
                                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    className="st-btn st-btn-danger st-btn-sm"
                                    onClick={() => console.warn('remove', acct.owner_id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </StCard>
              )}

              {/* ── ACCOUNT SECURITY ── */}
              {activeSection === 'security' && (
                <StCard
                  glyph={<ShieldIcon width="16" height="16" />}
                  title="Account security"
                  sub="Change the password for your admin account"
                >
                  {currentUser && (
                    <div className="st-row" style={{ paddingTop: 0 }}>
                      <div className="st-row-text">
                        <strong>Signed in as</strong>
                        <span>{currentUser.email ?? currentUser.name}</span>
                      </div>
                      <div className="st-admin-user">
                        <span className="st-admin-avatar">{initials(currentUser.name)}</span>
                        <div className="st-admin-meta">
                          <strong>{currentUser.name}</strong>
                          {currentUser.email && <small>{currentUser.email}</small>}
                        </div>
                        <span className="st-self-tag">Current account</span>
                      </div>
                    </div>
                  )}
                  <div className="st-stack">
                    {/* Current password */}
                    <div className="st-field-row">
                      <div className="st-field-row-label">
                        <strong>Current password</strong>
                        <span>Required to verify your identity.</span>
                      </div>
                      <div className="st-field">
                        <div className="st-input-wrap">
                          <input
                            className="st-input"
                            type={pwShowCur ? 'text' : 'password'}
                            placeholder="Current password"
                            value={pwCurrent}
                            onChange={(e) => setPwCurrent(e.target.value)}
                            autoComplete="current-password"
                          />
                          <button
                            className="st-input-icon"
                            type="button"
                            title={pwShowCur ? 'Hide' : 'Show'}
                            onClick={() => setPwShowCur((v) => !v)}
                          >
                            {pwShowCur
                              ? <EyeOffIcon width="13" height="13" />
                              : <EyeIcon    width="13" height="13" />}
                          </button>
                        </div>
                        {pwErrors.current && (
                          <span className="st-field-error">{pwErrors.current}</span>
                        )}
                      </div>
                    </div>

                    {/* New + Confirm */}
                    <div className="st-field-row">
                      <div className="st-field-row-label">
                        <strong>New password</strong>
                        <span>Minimum 8 characters.</span>
                      </div>
                      <div className="st-field">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div className="st-input-wrap" style={{ flex: 1 }}>
                            <input
                              className="st-input"
                              type={pwShowNew ? 'text' : 'password'}
                              placeholder="New password"
                              value={pwNew}
                              onChange={(e) => setPwNew(e.target.value)}
                              autoComplete="new-password"
                            />
                            <button
                              className="st-input-icon"
                              type="button"
                              title={pwShowNew ? 'Hide' : 'Show'}
                              onClick={() => setPwShowNew((v) => !v)}
                            >
                              {pwShowNew
                                ? <EyeOffIcon width="13" height="13" />
                                : <EyeIcon    width="13" height="13" />}
                            </button>
                          </div>
                          <div className="st-input-wrap" style={{ flex: 1 }}>
                            <input
                              className="st-input"
                              type={pwShowCon ? 'text' : 'password'}
                              placeholder="Confirm password"
                              value={pwConfirm}
                              onChange={(e) => setPwConfirm(e.target.value)}
                              autoComplete="new-password"
                            />
                            <button
                              className="st-input-icon"
                              type="button"
                              title={pwShowCon ? 'Hide' : 'Show'}
                              onClick={() => setPwShowCon((v) => !v)}
                            >
                              {pwShowCon
                                ? <EyeOffIcon width="13" height="13" />
                                : <EyeIcon    width="13" height="13" />}
                            </button>
                          </div>
                        </div>
                        {(pwErrors.new || pwErrors.confirm) && (
                          <span className="st-field-error">
                            {pwErrors.new ?? pwErrors.confirm}
                          </span>
                        )}
                      </div>
                    </div>

                    {pwError && (
                      <div className="st-callout" style={{ background: 'var(--color-danger-bg)', borderColor: '#fca5a5', color: 'var(--color-danger-text)' }}>
                        {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="st-callout" style={{ background: 'var(--color-success-bg)', borderColor: '#86efac', color: 'var(--color-success-text)' }}>
                        Password changed successfully.
                      </div>
                    )}
                  </div>

                  {/* Save bar */}
                  <div className="st-save-bar" style={{ margin: '4px -18px -18px' }}>
                    <div className="st-save-bar-status">
                      <ShieldIcon width="14" height="14" />
                      You&rsquo;ll stay signed in after saving.
                    </div>
                    <div className="st-save-bar-actions">
                      <button
                        className="st-btn st-btn-ghost"
                        onClick={handleCancelPassword}
                        disabled={pwSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="st-btn st-btn-primary"
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                      >
                        {pwSaving ? 'Saving…' : 'Change password'}
                      </button>
                    </div>
                  </div>
                </StCard>
              )}

              {/* ── OFFICE LOCATION (logbook) ── */}
              {activeSection === 'logbook' && (
                <StCard
                  glyph={<PinIcon width="16" height="16" />}
                  title="Office location"
                  sub="Geofence for the digital logbook"
                >
                  <div className="st-grid-coords">
                    <div className="st-field">
                      <label className="st-field-label">Latitude</label>
                      <input
                        className="st-input is-mono"
                        placeholder="e.g. 14.4017"
                        value={geoLat}
                        onChange={(e) => setGeoLat(e.target.value)}
                      />
                    </div>
                    <div className="st-field">
                      <label className="st-field-label">Longitude</label>
                      <input
                        className="st-input is-mono"
                        placeholder="e.g. 120.9413"
                        value={geoLng}
                        onChange={(e) => setGeoLng(e.target.value)}
                      />
                    </div>
                    <div className="st-field">
                      <label className="st-field-label">Radius</label>
                      <div className="st-input-suffix">
                        <input
                          className="st-input"
                          placeholder="150"
                          value={geoRadius}
                          onChange={(e) => setGeoRadius(e.target.value)}
                          type="number"
                          min={10}
                          max={5000}
                        />
                        <span className="st-input-suffix-tag">meters</span>
                      </div>
                    </div>
                  </div>

                  <div className="st-callout">
                    <AlertIcon width="14" height="14" className="st-callout-icon" />
                    <div>
                      <strong>Tip:</strong> open the office on Google Maps, right-click the building,
                      and paste the coordinates here.{' '}
                      <strong>{savedGeoRadius || geoRadius || '150'} m</strong> is the current geofence radius —
                      the blue circle on the map shows the allowed check-in zone.
                      Leave lat/lng blank to disable geolocation enforcement.
                    </div>
                  </div>

                  {/* Map preview — Leaflet with geofence circle; updates only on save */}
                  {savedGeoLat && savedGeoLng
                    && !isNaN(parseFloat(savedGeoLat)) && !isNaN(parseFloat(savedGeoLng)) && (
                    <div style={{
                      borderRadius: 12, overflow: 'hidden', height: 280,
                      border: '1px solid var(--color-border-soft)',
                      background: 'var(--color-surface-deep)',
                    }}>
                      <iframe
                        srcDoc={buildGeofenceMap(
                          parseFloat(savedGeoLat),
                          parseFloat(savedGeoLng),
                          parseFloat(savedGeoRadius || '150'),
                        )}
                        title="Office geofence preview"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        sandbox="allow-scripts"
                      />
                    </div>
                  )}

                  {geoError && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-danger-text)' }}>{geoError}</p>
                  )}

                  {/* Save bar — negative margins stretch it to card edges */}
                  <div className="st-save-bar" style={{ margin: '4px -18px -18px' }}>
                    <div className="st-save-bar-status">
                      <PinIcon width="14" height="14" />
                      {geoLat && geoLng ? (
                        <>Pinned to <strong style={{ color: 'var(--color-text-primary)', marginLeft: 4 }}>CvSU Imus — CSG Office</strong></>
                      ) : (
                        'No location set — geofence disabled'
                      )}
                    </div>
                    <div className="st-save-bar-actions">
                      <button
                        className="st-btn st-btn-primary"
                        onClick={handleSaveGeo}
                        disabled={geoSaving}
                      >
                        {geoSaving ? 'Saving…' : 'Save location'}
                      </button>
                      {geoSaved && (
                        <span style={{ fontSize: 12, color: 'var(--color-success-text)' }}>✓ Saved</span>
                      )}
                    </div>
                  </div>
                </StCard>
              )}

              {/* ── OFFICE HOURS ── */}
              {activeSection === 'office_hours' && (
                <StCard
                  glyph={<ClockIcon width="16" height="16" />}
                  title="Office hours"
                  sub="When the CSG office is staffed — drives auto-checkout and the public Office page"
                >
                  {/* Column headers */}
                  <div className="st-oh-grid">
                    <div className="st-oh-header">
                      <span>Day</span>
                      <span />
                      <div className="st-oh-times-header">
                        <span>Opens</span>
                        <span className="st-oh-sep">→</span>
                        <span className="st-oh-header-auto">Auto-checkout</span>
                      </div>
                    </div>

                    {officeHours.map((row, idx) => {
                      const isClosed = row.open === null;
                      const isToday  = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === row.day;
                      return (
                        <div key={row.day} className={`st-oh-row${isClosed ? ' is-closed' : ''}${isToday ? ' is-today' : ''}`}>
                          {/* Day name */}
                          <div className="st-oh-day">
                            <span className="st-oh-day-name">{row.day}</span>
                            {isToday && <span className="st-self-tag">Today</span>}
                          </div>

                          {/* Toggle */}
                          <button
                            className={`st-toggle${!isClosed ? ' is-on' : ''}`}
                            onClick={() => toggleOhDay(idx)}
                            aria-pressed={!isClosed}
                            title={isClosed ? 'Mark as open' : 'Mark as closed'}
                          />

                          {/* Time range or closed label */}
                          <div className="st-oh-times">
                            {isClosed ? (
                              <span className="st-oh-closed-lbl">Closed — no auto-checkout</span>
                            ) : (
                              <>
                                <input
                                  className="st-input is-mono st-oh-time-input"
                                  type="time"
                                  value={row.open ?? '08:00'}
                                  onChange={(e) => updateOhDay(idx, 'open', e.target.value)}
                                />
                                <span className="st-oh-sep">→</span>
                                <div className="st-oh-auto-wrap">
                                  <input
                                    className="st-input is-mono st-oh-time-input st-oh-time-input--auto"
                                    type="time"
                                    value={row.close ?? '19:00'}
                                    onChange={(e) => updateOhDay(idx, 'close', e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto-checkout live status */}
                  {(() => {
                    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    const todayRow  = officeHours.find((r) => r.day === todayName);
                    const closeTime = todayRow?.open !== null ? (todayRow?.close ?? null) : null;

                    if (!closeTime) {
                      return (
                        <div className="st-oh-auto-status is-closed">
                          <ClockIcon width="14" height="14" />
                          <div className="st-oh-auto-body">
                            <span className="st-oh-auto-label">Today&rsquo;s auto-checkout</span>
                            <span className="st-oh-auto-val is-muted">{todayName} is marked closed — no auto-checkout today</span>
                          </div>
                        </div>
                      );
                    }

                    // Parse close time and compute PH countdown
                    const [ch, cm] = closeTime.split(':').map(Number);
                    const closeMin = ch * 60 + cm;
                    const now      = new Date(nowMs);
                    const utcMin   = now.getUTCHours() * 60 + now.getUTCMinutes();
                    const curMin   = (utcMin + 8 * 60) % (24 * 60); // UTC+8
                    const diffMin  = closeMin - curMin;

                    const h12    = ch % 12 || 12;
                    const ampm   = ch >= 12 ? 'PM' : 'AM';
                    const fmtMin = cm === 0 ? '' : `:${String(cm).padStart(2, '0')}`;
                    const fmtClose = `${h12}${fmtMin} ${ampm}`;

                    let countdownStr: string;
                    let isDone = false;
                    if (diffMin <= 0) {
                      countdownStr = 'Already ran today';
                      isDone = true;
                    } else {
                      const hLeft = Math.floor(diffMin / 60);
                      const mLeft = diffMin % 60;
                      countdownStr = hLeft === 0
                        ? `Triggers in ${mLeft}m`
                        : mLeft === 0
                        ? `Triggers in ${hLeft}h`
                        : `Triggers in ${hLeft}h ${mLeft}m`;
                    }

                    return (
                      <div className="st-oh-auto-status">
                        <ClockIcon width="14" height="14" />
                        <div className="st-oh-auto-body">
                          <span className="st-oh-auto-label">Today&rsquo;s auto-checkout ({todayName})</span>
                          <span className="st-oh-auto-val">{fmtClose}</span>
                        </div>
                        <span className={`st-oh-auto-countdown${isDone ? ' is-done' : ''}`}>
                          {countdownStr}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="st-callout">
                    <AlertIcon width="14" height="14" className="st-callout-icon" />
                    <div>
                      The <strong>Auto-checkout</strong> time is when the logbook automatically checks out officers who forget to scan the exit QR.
                      Edit it by changing the closing time for each day above. Changes take effect within 5 minutes.
                    </div>
                  </div>

                  {ohError && (
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-danger-text)' }}>{ohError}</p>
                  )}

                  <div className="st-save-bar" style={{ margin: '4px -18px -18px' }}>
                    <div className="st-save-bar-status">
                      <ClockIcon width="14" height="14" />
                      Save to update the auto-checkout schedule immediately.
                    </div>
                    <div className="st-save-bar-actions">
                      <button
                        className="st-btn st-btn-primary"
                        onClick={handleSaveOfficeHours}
                        disabled={ohSaving}
                      >
                        {ohSaving ? 'Saving…' : 'Save hours'}
                      </button>
                      {ohSaved && (
                        <span style={{ fontSize: 12, color: 'var(--color-success-text)' }}>✓ Saved</span>
                      )}
                    </div>
                  </div>
                </StCard>
              )}

              {/* ── COMMITTEE PINs ── */}
              {activeSection === 'pins' && (
                <StCard
                  glyph={<KeyIcon width="16" height="16" />}
                  title="Committee PINs"
                  sub="Codes each committee uses to enter their portal"
                >
                  <div className="st-pins">
                    {PIN_CARDS.map((p) => (
                      <div key={p.role} className="st-pin-card">
                        <div className="st-pin-head">
                          <span className="st-pin-name">{p.name}</span>
                          <span className="st-pin-scope">{p.scope}</span>
                        </div>
                        <div className="st-pin-input">
                          <div className="st-input-wrap" style={{ flex: 1 }}>
                            <input
                              className="st-input is-mono"
                              type={pinVisible[p.role] ? 'text' : 'password'}
                              placeholder="Enter PIN…"
                              value={pins[p.role]}
                              onChange={(e) => setPins((prev) => ({ ...prev, [p.role]: e.target.value }))}
                              autoComplete="off"
                            />
                            <button
                              className="st-input-icon"
                              type="button"
                              title={pinVisible[p.role] ? 'Hide PIN' : 'Reveal PIN'}
                              onClick={() => setPinVisible((v) => ({ ...v, [p.role]: !v[p.role] }))}
                            >
                              {pinVisible[p.role]
                                ? <EyeOffIcon width="13" height="13" />
                                : <EyeIcon    width="13" height="13" />}
                            </button>
                          </div>
                          <button
                            className="st-input-icon"
                            type="button"
                            title="Copy PIN"
                            onClick={() => handleCopyPin(pins[p.role])}
                            style={{ background: 'var(--color-surface-deep)', border: '1px solid var(--color-border-soft)', borderRadius: 8, width: 36, height: 36, flexShrink: 0 }}
                          >
                            <CopyIcon width="13" height="13" />
                          </button>
                          <button
                            className="st-btn st-btn-primary st-btn-sm"
                            onClick={() => handleSavePin(p.role)}
                            disabled={pinSaving[p.role] || !pins[p.role].trim()}
                          >
                            {pinSaving[p.role] ? '…' : pinSaved[p.role] ? '✓' : 'Save'}
                          </button>
                        </div>
                        {pinError[p.role] && (
                          <p className="st-field-error" style={{ margin: 0 }}>{pinError[p.role]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="st-callout">
                    <AlertIcon width="14" height="14" className="st-callout-icon" />
                    <div>
                      Rotating a PIN signs out anyone currently using the old one.
                      Share the new code in the committee group chat after saving.
                    </div>
                  </div>
                </StCard>
              )}

              {/* ── ABOUT ── */}
              {activeSection === 'about' && (
                <div className="st-about">
                  <div className="st-about-stat">
                    <span className="st-about-stat-lbl">Version</span>
                    <span className="st-about-stat-val">v1.8.0 <small>Stable</small></span>
                  </div>
                  <div className="st-about-stat">
                    <span className="st-about-stat-lbl">Last update</span>
                    <span className="st-about-stat-val">May 28, 2026</span>
                  </div>
                  <div className="st-about-stat">
                    <span className="st-about-stat-lbl">Environment</span>
                    <span className="st-about-stat-val">
                      {['localhost', '127.0.0.1'].includes(window.location.hostname)
                        ? 'Development'
                        : 'Production'}
                    </span>
                  </div>
                  <div className="st-about-spacer" />
                  <button className="st-btn st-btn-ghost" onClick={() => setIsChangelogOpen(true)}>
                    <DocIcon width="13" height="13" />View changelog
                  </button>
                </div>
              )}

            </div>{/* end .st-pane */}
          </div>{/* end .st-twopane */}

        </div>{/* end .st-page */}
      </main>

      {/* ── Modals ── */}
      {pauseModal && (
        <PauseAccessModal
          isPause={pause}
          isOpen={pauseModal}
          onClose={() => setPauseModal(false)}
          onConfirm={handlePauseConfirm}
        />
      )}
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
    </div>
  );
};

export default Settings;
