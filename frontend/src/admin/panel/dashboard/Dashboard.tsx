import './dashboard.css';
import '../_shared/admin-list.css';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../_shared/Sidebar';
import ReservationCalendar, { type AdminDot } from '../../../components/reservation-calendar/ReservationCalendar';
import GeofenceMap from '../../components/GeofenceMap/GeofenceMap';

const API_URL = import.meta.env.VITE_API_URL as string;
const LIMIT_MB = 1024;

/* ── Interfaces ──────────────────────────────────────────── */
interface AnalyticsData {
  total_officers: number;
  total_documents: number;
  total_announcements: number;
  total_events: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_by: string;
  ip_address: string;
  created_at: string;
}

interface StorageBucket {
  name: string;
  size: number;
}

interface BorrowRequest {
  id: string;
  equipment_name?: string;
  borrower_name?: string;
  borrower_id?: string;
  borrower_email?: string;
  borrow_date?: string;
  return_date?: string;
  status?: string;
  purpose_type?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const shortId = (uuid: string | null): string =>
  uuid ? uuid.substring(0, 8) + '…' : '—';

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatGreetingDate(): string {
  const d = new Date();
  const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const date = d.getDate();
  const year = d.getFullYear();
  return `${day} · ${month} ${date}, ${year}`;
}

/* ── Icons ───────────────────────────────────────────────── */
const IDoc = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>
  </svg>
);
const IBell = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);
const ICalendar = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IUsers = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IUpload = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IArrow = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const IHdd = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6.5 18h.01M10.5 18h.01"/>
    <path d="M3 14l3-8h12l3 8"/>
  </svg>
);
const IEye = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

/* ── Pure SVG chart primitives ───────────────────────────── */
function BarChart({ data, height = 220 }: { data: { label: string; count: number }[]; height?: number }) {
  const width = 460;
  const max = Math.max(...data.map((d) => d.count), 1);
  const padL = 36, padR = 12, padT = 14, padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const barW = (innerW / data.length) * 0.62;
  const gap  = (innerW / data.length) * 0.38;
  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Document uploads bar chart">
      <defs>
        <linearGradient id="dh-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-mid)" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + (innerH / yTicks) * i;
        const v = Math.round((max * (yTicks - i)) / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#eef0f5" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af"
              fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="500">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.count / max) * innerH;
        const x = padL + i * (innerW / data.length) + gap / 2;
        const y = padT + innerH - h;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="4"
              fill={isLast ? 'var(--color-primary-deep)' : 'url(#dh-bar)'} />
            <text x={x + barW / 2} y={height - 10} textAnchor="middle"
              fontSize="10.5" fill={isLast ? '#0f1729' : '#6b7280'}
              fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight={isLast ? 700 : 500}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ used, total, size = 180 }: { used: number; total: number; size?: number }) {
  const pct = total > 0 ? used / total : 0;
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-label={`Storage: ${(pct * 100).toFixed(0)}% used`}>
      <defs>
        <linearGradient id="dh-donut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-deep)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--color-surface-deep)" strokeWidth="22" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#dh-donut)" strokeWidth="22"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle"
        fontSize="22" fontWeight="800" fill="#0f1729"
        fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.02em">
        {(pct * 100).toFixed(0)}%
      </text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle"
        fontSize="10" fontWeight="600" fill="#6b7280"
        fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="0.5">
        USED
      </text>
    </svg>
  );
}

function Sparkline({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="var(--color-primary)" />
    </svg>
  );
}

/* ── Multi-line views chart ──────────────────────────────── */
type LineKey = 'total' | 'document' | 'announcement' | 'event';

const VIEW_LINES: { key: LineKey; color: string; label: string; dashed?: boolean }[] = [
  { key: 'total',        color: '#374151', label: 'Total Views',   dashed: true  },
  { key: 'document',     color: '#4f6fd1', label: 'Documents'                    },
  { key: 'announcement', color: '#10b981', label: 'Announcements'                },
  { key: 'event',        color: '#f59e0b', label: 'Events'                       },
];

interface ViewStats {
  dates: string[];
  document: number[];
  announcement: number[];
  event: number[];
  total?: number[];
}

function ViewsLineChart({ stats, height = 220 }: { stats: ViewStats; height?: number }) {
  const W = 340, padL = 32, padR = 8, padT = 12, padB = 26;
  const innerW = W - padL - padR;
  const innerH = height - padT - padB;

  // Only include lines that have data in this stats object
  const activeLines = VIEW_LINES.filter(l => {
    const vals = stats[l.key];
    return Array.isArray(vals) && vals.length > 0;
  });

  const allVals = activeLines.flatMap(l => stats[l.key] as number[]);
  const max     = Math.max(...allVals, 1);
  const n       = stats.dates.length;

  const toX = (i: number) => padL + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const toY = (v: number) => padT + innerH - (v / max) * innerH;

  const pointStr = (vals: number[]) =>
    vals.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const labelStep = n <= 7 ? 1 : Math.ceil(n / 6);
  const yMarks = [0.25, 0.5, 0.75, 1.0];
  const isEmpty = allVals.every((v) => v === 0);

  return (
    <div>
      {/* Legend */}
      <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
        {activeLines.map(l => (
          <span key={l.key} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:'var(--color-text-muted)', fontWeight:600 }}>
            <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true">
              {l.dashed
                ? <line x1="0" y1="4" x2="16" y2="4" stroke={l.color} strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                : <line x1="0" y1="4" x2="16" y2="4" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" />
              }
            </svg>
            {l.label}
          </span>
        ))}
      </div>

      {isEmpty ? (
        <div style={{ height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
          <IEye width="20" height="20" style={{ opacity: 0.2 }} />
          <p style={{ fontSize:12, color:'var(--color-text-hint)', margin:0, textAlign:'center', maxWidth:200 }}>
            No views recorded yet. Views appear here as users browse public pages.
          </p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="Content views line chart">
          {/* Y gridlines */}
          {yMarks.map((frac) => {
            const y = toY(max * frac);
            return (
              <g key={frac}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef0f5" strokeWidth="1" />
                <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize="8.5" fill="#9ca3af"
                  fontFamily="'Plus Jakarta Sans', sans-serif">
                  {Math.round(max * frac)}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {activeLines.map(l => (
            <polyline
              key={l.key}
              points={pointStr(stats[l.key] as number[])}
              fill="none"
              stroke={l.color}
              strokeWidth={l.key === 'total' ? 1.5 : 2}
              strokeDasharray={l.dashed ? '4 3' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          ))}

          {/* End-point dots */}
          {activeLines.map(l => {
            const vals = stats[l.key] as number[];
            const last = vals[n - 1] ?? 0;
            return (
              <circle key={l.key + '-dot'} cx={toX(n - 1)} cy={toY(last)} r="3"
                fill={l.color} />
            );
          })}

          {/* X labels */}
          {stats.dates.map((d, i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null;
            const label = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <text key={d} x={toX(i)} y={height - 6} textAnchor="middle"
                fontSize="8.5" fill="#9ca3af" fontFamily="'Plus Jakarta Sans', sans-serif">
                {label}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Dashboard component ─────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [recentLogs, setRecentLogs] = useState<AuditEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);

  const [weeklyUploads, setWeeklyUploads] = useState<{ label: string; count: number }[]>([]);
  const [weeklyDataFallback, setWeeklyDataFallback] = useState(false);
  const [documentsThisWeek, setDocumentsThisWeek] = useState<number | null>(null);

  const [storageData, setStorageData] = useState<StorageBucket[]>([]);
  // All pending + approved requests used by the calendar widget
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  // Mini calendar state
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calSelected, setCalSelected] = useState<string | null>(null);
  const [viewStats7, setViewStats7]   = useState<ViewStats | null>(null);
  const [viewStats30, setViewStats30] = useState<ViewStats | null>(null);
  const [viewRange, setViewRange]     = useState<7 | 30>(7);
  /* Content Views card tab: 'views' = line chart, 'documents' = uploads bar chart */
  const [contentTab, setContentTab]   = useState<'views' | 'documents'>('views');
  // Geofence map
  const [geoLat,    setGeoLat]    = useState('');
  const [geoLng,    setGeoLng]    = useState('');
  const [geoRadius, setGeoRadius] = useState('');

  // Read cached admin name (set by Sidebar) — no extra API call needed
  const [adminFirstName] = useState<string>(() => {
    const cached = localStorage.getItem('csg_admin_name') ?? 'Admin';
    return cached.split(' ')[0];
  });

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_URL}/dashboard/summary`, {
        withCredentials: true,
      });
      setAnalytics({
        total_officers:      data.officers?.active ?? 0,
        total_documents:     data.documents?.active ?? 0,
        total_announcements: data.announcements?.active ?? 0,
        total_events:        data.events?.active ?? 0,
      });
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(false);
    try {
      const { data } = await axios.get<AuditEntry[]>(`${API_URL}/auditlog/?limit=5`, {
        withCredentials: true,
      });
      setRecentLogs(data);
    } catch {
      setLogsError(true);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchWeeklyUploads = useCallback(async () => {
    try {
      const { data } = await axios.get<{ createdAt: string }[]>(`${API_URL}/documents/`, {
        withCredentials: true,
      });
      const now = new Date();
      const weeks: { label: string; count: number; weekStart: Date }[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        weeks.push({ label: `Wk ${getISOWeek(d)}`, count: 0, weekStart: d });
      }
      data.forEach((doc) => {
        const created = new Date(doc.createdAt);
        const wk = getISOWeek(created);
        const yr = created.getFullYear();
        const match = weeks.find(
          (w) => getISOWeek(w.weekStart) === wk && w.weekStart.getFullYear() === yr,
        );
        if (match) match.count++;
      });
      const mapped = weeks.map((w) => ({ label: w.label, count: w.count }));
      setWeeklyUploads(mapped);
      setDocumentsThisWeek(mapped[mapped.length - 1]?.count ?? 0);
      setWeeklyDataFallback(false);
    } catch {
      setWeeklyDataFallback(true);
    }
  }, []);

  const fetchStorage = useCallback(async () => {
    try {
      const { data } = await axios.get<StorageBucket[] | { error: string }>(
        `${API_URL}/dashboard/storage`,
        { withCredentials: true },
      );
      if (Array.isArray(data)) setStorageData(data);
    } catch { /* silent — storage card shows 0 */ }
  }, []);

  const fetchPendingBorrows = useCallback(async () => {
    try {
      // Fetch both pending and approved so the calendar can show dots for both
      const [pendingRes, approvedRes] = await Promise.allSettled([
        axios.get<BorrowRequest[]>(`${API_URL}/borrowing/requests?status=pending`,  { withCredentials: true }),
        axios.get<BorrowRequest[]>(`${API_URL}/borrowing/requests?status=approved`, { withCredentials: true }),
      ]);
      const pending  = pendingRes.status  === 'fulfilled' ? pendingRes.value.data  : [];
      const approved = approvedRes.status === 'fulfilled' ? approvedRes.value.data : [];
      setBorrowRequests([
        ...(Array.isArray(pending)  ? pending  : []),
        ...(Array.isArray(approved) ? approved : []),
      ]);
    } catch {
      setBorrowRequests([]);
    }
  }, []);

  const fetchViewStats = useCallback(async () => {
    try {
      const [r7, r30] = await Promise.all([
        axios.get<ViewStats>(`${API_URL}/views/stats?days=7`,  { withCredentials: true }),
        axios.get<ViewStats>(`${API_URL}/views/stats?days=30`, { withCredentials: true }),
      ]);
      setViewStats7(r7.data);
      setViewStats30(r30.data);
    } catch {
      // Non-fatal: migration may not be run yet; chart shows empty state
    }
  }, []);

  const fetchGeoConfig = useCallback(async () => {
    const [latR, lngR, radR] = await Promise.allSettled([
      axios.get(`${API_URL}/settings/logbook_lat`,      { withCredentials: true }),
      axios.get(`${API_URL}/settings/logbook_lng`,      { withCredentials: true }),
      axios.get(`${API_URL}/settings/logbook_radius_m`, { withCredentials: true }),
    ]);
    if (latR.status === 'fulfilled') setGeoLat(latR.value.data.value ?? '');
    if (lngR.status === 'fulfilled') setGeoLng(lngR.value.data.value ?? '');
    if (radR.status === 'fulfilled') setGeoRadius(radR.value.data.value ?? '150');
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchRecentLogs();
    fetchWeeklyUploads();
    fetchStorage();
    fetchPendingBorrows();
    fetchViewStats();
    fetchGeoConfig();
  }, [fetchSummary, fetchRecentLogs, fetchWeeklyUploads, fetchStorage, fetchPendingBorrows, fetchViewStats, fetchGeoConfig]);

  /* Computed values */
  const totalUsedMB = storageData.reduce((s, b) => s + b.size, 0) / (1024 * 1024);
  const freeMB = Math.max(0, LIMIT_MB - totalUsedMB);

  const kpiTiles = [
    {
      label: 'Documents', value: analytics?.total_documents ?? 0, delta: '+8 this month',
      trend: 'up' as const, spark: weeklyUploads.map(w => w.count), Icon: IDoc,
    },
    {
      label: 'Announcements', value: analytics?.total_announcements ?? 0, delta: '+12 this month',
      trend: 'up' as const, spark: [4, 6, 5, 7, 9, 8, 12, 10], Icon: IBell,
    },
    {
      label: 'Events', value: analytics?.total_events ?? 0, delta: '3 upcoming',
      trend: 'flat' as const, spark: [1, 0, 2, 1, 3, 2, 1, 2], Icon: ICalendar,
    },
    {
      label: 'Officers', value: analytics?.total_officers ?? 0, delta: '+2 this term',
      trend: 'up' as const, spark: [80, 81, 82, 82, 83, 84, 84, 85], Icon: IUsers,
    },
  ];

  return (
    <div className="ad-shell">
      <Sidebar active="dashboard" />
      <main className="ad-main dh-main">
      {fetchError && (
        <p style={{ padding: '0.5rem 0', color: 'var(--color-danger-text)', fontSize: '13px' }}>
          {fetchError}
        </p>
      )}

      {/* Greeting band */}
      <header className="dh-greeting">
        <div>
          <span className="dh-page-eyebrow">{formatGreetingDate()}</span>
          <h1>Good {timeOfDay()}, <em>{adminFirstName}</em>.</h1>
          {(() => {
            const pendingCount = borrowRequests.filter(r => r.status === 'pending').length;
            return (
              <p>
                You have{' '}
                <strong>{pendingCount} pending borrow {pendingCount === 1 ? 'request' : 'requests'}</strong>
                {' '}and{' '}
                <strong>{documentsThisWeek ?? 0} {(documentsThisWeek ?? 0) === 1 ? 'document' : 'documents'}</strong>
                {' '}uploaded this week.
              </p>
            );
          })()}
        </div>
        <div className="dh-page-actions">
          <button className="dh-action" onClick={() => navigate('/admin?panel=announcement&action=new')}>
            <IBell width="14" height="14" /> Post announcement
          </button>
          <button className="dh-action is-primary" onClick={() => navigate('/admin?panel=documents&action=upload')}>
            <IUpload width="14" height="14" /> Upload document
          </button>
        </div>
      </header>

      {/* KPI band */}
      <section className="dh-kpi-row dh-kpi-row--four">
        {kpiTiles.map((k) => (
          <div key={k.label} className={`dh-kpi dh-kpi--v2 trend-${k.trend}`}>
            <div className="dh-kpi-top">
              <span className="dh-kpi-icon">
                <k.Icon width="16" height="16" />
              </span>
              <Sparkline data={k.spark} />
            </div>
            <span className="dh-kpi-value">
              {loading ? '—' : k.value}
            </span>
            <span className="dh-kpi-label">{k.label}</span>
            <span className="dh-kpi-delta">{k.delta}</span>
          </div>
        ))}
      </section>

      {/* Workspace */}
      <section className="dh-workspace">
        {/* Left column */}
        <div className="dh-ws-main">
          {/* Content Views / Document Uploads card */}
          {(() => {
            const rawStats = viewRange === 7 ? viewStats7 : viewStats30;
            return (
              <div className="dh-card dh-views">
                <div className="dh-card-head">
                  <div>
                    <span className="dh-card-eyebrow">
                      {contentTab === 'views'
                        ? (viewRange === 7 ? 'Last 7 days' : 'Last 30 days')
                        : 'Last 8 weeks'}
                    </span>
                    <h3>{contentTab === 'views' ? 'Content Views' : 'Document Uploads'}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Content tab switcher */}
                    <div className="dh-tabs">
                      <button
                        className={`dh-tab${contentTab === 'views' ? ' is-active' : ''}`}
                        onClick={() => setContentTab('views')}
                      >Views</button>
                      <button
                        className={`dh-tab${contentTab === 'documents' ? ' is-active' : ''}`}
                        onClick={() => setContentTab('documents')}
                      >Documents</button>
                    </div>
                    {/* Time range selector — only relevant for Views */}
                    {contentTab === 'views' && (
                      <div className="dh-tabs">
                        <button
                          className={`dh-tab${viewRange === 7 ? ' is-active' : ''}`}
                          onClick={() => setViewRange(7)}
                        >7d</button>
                        <button
                          className={`dh-tab${viewRange === 30 ? ' is-active' : ''}`}
                          onClick={() => setViewRange(30)}
                        >30d</button>
                      </div>
                    )}
                  </div>
                </div>

                {contentTab === 'views' ? (
                  rawStats ? (
                    <ViewsLineChart stats={rawStats} height={220} />
                  ) : (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--color-text-hint)', margin: 0 }}>Loading…</p>
                    </div>
                  )
                ) : (
                  weeklyDataFallback ? (
                    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <IUpload width="20" height="20" style={{ opacity: 0.2 }} />
                      <p style={{ fontSize: 12, color: 'var(--color-text-hint)', margin: 0, textAlign: 'center', maxWidth: 200 }}>
                        Could not load upload data.
                      </p>
                    </div>
                  ) : (
                    <BarChart data={weeklyUploads} height={220} />
                  )
                )}
              </div>
            );
          })()}

          {/* Recent Activity card */}
          <div className="dh-card">
            <div className="dh-card-head">
              <h3>Recent Activity</h3>
              <button className="dh-btn-ghost" onClick={() => navigate('/admin?panel=auditlog')}>
                View all logs <IArrow width="13" height="13" />
              </button>
            </div>
            {logsLoading ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading…</p>
            ) : logsError ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Could not load recent activity.</p>
            ) : (
              <table className="dh-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="dh-act-time">
                        {entry.created_at ? timeAgo(entry.created_at) : '—'}
                      </td>
                      <td>
                        <span className={`dh-act-badge tone-${
                          entry.action === 'DELETE' ? 'danger'
                          : entry.action === 'INSERT' ? 'success'
                          : 'primary'
                        }`}>
                          {entry.action ?? '—'}
                        </span>
                      </td>
                      <td className="dh-act-entity">{entry.entity ?? '—'}</td>
                      <td className="dh-act-by">
                        <span className="dh-mini-avatar">
                          {entry.created_by ? entry.created_by.substring(0, 2).toUpperCase() : '??'}
                        </span>
                        {shortId(entry.created_by)}
                      </td>
                    </tr>
                  ))}
                  {recentLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', padding: '1rem' }}>
                        No activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Geofence map card */}
          {geoLat && geoLng && !isNaN(parseFloat(geoLat)) && !isNaN(parseFloat(geoLng)) && (
            <div className="dh-card">
              <div className="dh-card-head">
                <div>
                  <span className="dh-card-eyebrow">Logbook · QR check-in</span>
                  <h3>Office Geofence</h3>
                </div>
                <button className="dh-btn-ghost" onClick={() => navigate('/admin?panel=settings&section=logbook')}>
                  Edit <IArrow width="12" height="12" />
                </button>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 240, border: '1px solid var(--color-border-soft)' }}>
                <GeofenceMap
                  lat={parseFloat(geoLat)}
                  lng={parseFloat(geoLng)}
                  radiusM={parseFloat(geoRadius || '150')}
                />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Blue circle = {geoRadius || '150'} m allowed check-in radius · CvSU Imus — CSG Office
              </p>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="dh-ws-rail">
          {/* Storage card */}
          <div className="dh-card dh-storage">
            <div className="dh-card-head">
              <h3>Storage</h3>
              <span className="dh-stat-delta is-flat">
                {totalUsedMB > 0 ? `${Math.min(100, (totalUsedMB / LIMIT_MB * 100)).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="dh-donut-row dh-donut-row--stack">
              <Donut used={totalUsedMB} total={LIMIT_MB} size={156} />
              <div className="dh-donut-legend">
                <div className="dh-legend-row">
                  <span className="dh-legend-swatch" style={{ background: 'var(--color-primary)' }} />
                  <div>
                    <span className="dh-legend-label">Used</span>
                    <span className="dh-legend-value">{totalUsedMB.toFixed(1)} MB</span>
                  </div>
                </div>
                <div className="dh-legend-row">
                  <span className="dh-legend-swatch" style={{ background: 'var(--color-surface-deep)' }} />
                  <div>
                    <span className="dh-legend-label">Free</span>
                    <span className="dh-legend-value">{freeMB.toFixed(1)} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Borrow requests calendar widget */}
          {(() => {
            // Build date → requests map for dot display
            const dateMap = new Map<string, BorrowRequest[]>();
            for (const r of borrowRequests) {
              if (!r.borrow_date) continue;
              const existing = dateMap.get(r.borrow_date) ?? [];
              existing.push(r);
              dateMap.set(r.borrow_date, existing);
            }

            const getDots = (dateStr: string): AdminDot[] => {
              const reqs = dateMap.get(dateStr) ?? [];
              const dots: AdminDot[] = [];
              if (reqs.some(r => r.status === 'pending'))  dots.push({ tone: 'pending' });
              if (reqs.some(r => r.status === 'approved')) dots.push({ tone: 'approved' });
              return dots;
            };

            const selectedReqs = calSelected ? (dateMap.get(calSelected) ?? []) : [];
            const pendingCount = borrowRequests.filter(r => r.status === 'pending').length;

            return (
              <div className="dh-card dh-pending">
                <div className="dh-card-head">
                  <div>
                    <h3>Borrow requests</h3>
                    <span className="dh-card-sub">{pendingCount} pending approval</span>
                  </div>
                  {pendingCount > 0 && <span className="dh-pulse" />}
                </div>

                <ReservationCalendar
                  year={calYear}
                  month={calMonth}
                  onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
                  variant="admin-dots"
                  getDots={getDots}
                  selectedDate={calSelected}
                  onDateClick={(d) => setCalSelected(calSelected === d ? null : d)}
                />

                {/* Dot legend */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-warning, #f59e0b)', display: 'inline-block' }} />
                    Pending
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-success, #22c55e)', display: 'inline-block' }} />
                    Approved
                  </span>
                </div>

                {/* Inline date detail */}
                {calSelected && (
                  <div className="dh-cal-detail">
                    <div className="dh-cal-detail-head">
                      <span>{calSelected}</span>
                      <button onClick={() => setCalSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1 }}>×</button>
                    </div>
                    {selectedReqs.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>No requests on this date.</p>
                    ) : (
                      <ul className="dh-pending-list" style={{ marginTop: 0 }}>
                        {selectedReqs.map((r, i) => (
                          <li key={i}>
                            <span className="dh-pending-mark">
                              <IHdd width="14" height="14" />
                            </span>
                            <div className="dh-pending-text">
                              <span className="dh-pending-item">{r.equipment_name ?? '—'}</span>
                              <span className="dh-pending-meta">
                                {r.borrower_name ?? '—'}
                                {' · '}
                                <span style={{
                                  fontWeight: 700,
                                  color: r.status === 'pending' ? 'var(--color-warning-text, #92400e)' : 'var(--color-success-text, #15803d)',
                                }}>
                                  {r.status}
                                </span>
                              </span>
                            </div>
                            <button className="dh-pending-cta" onClick={() => navigate('/admin?panel=borrowing')}>
                              Review <IArrow width="11" height="11" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <button
                  className="dh-btn-ghost"
                  style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                  onClick={() => navigate('/admin?panel=borrowing')}
                >
                  View all requests <IArrow width="12" height="12" />
                </button>
              </div>
            );
          })()}

        </aside>
      </section>
    </main>
    </div>
  );
};

export default Dashboard;
