/**
 * AdminLogbook — /admin?panel=logbook
 *
 * "Office Duty" panel: live roster hero + KPI tiles + filter toolbar + sessions table.
 * Design: OfficeDutyHybrid from office-duty-variants.jsx
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import '../_shared/admin-list.css';
import '../_shared/office-duty.css';
import Sidebar from '../_shared/Sidebar';
import { PageHead } from '../_shared/chrome';
import { I } from '../_shared/icons';

const API = import.meta.env.VITE_API_URL as string;

/* ─── Types ──────────────────────────────────────────────── */
interface OfficerInfo {
  id:             string;
  full_name:      string;
  position:       string;
  avatar_url:     string | null;
  committee_id?:  number | null;
  committee_name?: string | null;
}

interface LogbookSession {
  id:            string;
  date:          string;
  check_in_at:   string;
  check_out_at:  string | null;
  check_in_lat:  number | null;
  check_in_lng:  number | null;
  auto_checkout: boolean;
  officer:       OfficerInfo | null;
}

/* ─── Helpers ────────────────────────────────────────────── */
const todayStr = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

function durMin(checkIn: string, checkOut: string | null): number {
  const end = checkOut ? new Date(checkOut) : new Date();
  return Math.floor((end.getTime() - new Date(checkIn).getTime()) / 60_000);
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

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

/* ─── Mini avatar ────────────────────────────────────────── */
function OfficerAvatar({ officer, size }: { officer: OfficerInfo; size: number }) {
  const [imgErr, setImgErr] = useState(false);
  const [c1, c2] = getGradient(officer.id);
  const fontSize = size >= 44 ? 15 : 12;

  if (officer.avatar_url && !imgErr) {
    return (
      <span className="od-now-avatar" style={{ width: size, height: size }}>
        <img
          src={officer.avatar_url}
          alt={officer.full_name}
          onError={() => setImgErr(true)}
        />
      </span>
    );
  }
  return (
    <span
      className="od-now-avatar"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c1}, ${c2})`, fontSize }}
    >
      {getInitials(officer.full_name)}
    </span>
  );
}

/* ─── Table mini avatar (uses ad-mini-avatar classes) ───────  */
function MiniAvatar({ officer }: { officer: OfficerInfo }) {
  const [imgErr, setImgErr] = useState(false);
  const [c1, c2] = getGradient(officer.id);

  if (officer.avatar_url && !imgErr) {
    return (
      <span
        className="ad-mini-avatar"
        style={{ overflow: 'hidden' }}
        title={officer.full_name}
      >
        <img
          src={officer.avatar_url}
          alt={officer.full_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={() => setImgErr(true)}
        />
      </span>
    );
  }
  return (
    <span
      className="ad-mini-avatar"
      title={officer.full_name}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {getInitials(officer.full_name)}
    </span>
  );
}

/* ─── Geo icon ───────────────────────────────────────────── */
const GeoIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CheckInIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const CheckOutIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const QrIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9 0h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm-3-5h2v2h-2v-2zm3 0h2v2h-2v-2zm-3-3h2v2h-2v-2zm3 0h2v2h-2v-2z"/>
  </svg>
);

/* ─── Date helpers ───────────────────────────────────────── */
function fmtDateLong(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function fmtDateMed(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function addMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00').getTime() - new Date(a + 'T00:00').getTime()) / 86_400_000) + 1;
}

/* ─── CalendarPicker ─────────────────────────────────────── */
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarPicker({
  availableDates,
  from, to,
  onFromChange, onToChange,
}: {
  availableDates: Set<string>;
  from: string; to: string;
  onFromChange: (d: string) => void;
  onToChange:   (d: string) => void;
}) {
  const today = todayStr();
  // Start calendar on the month containing the latest available date (or today)
  const latestAvailable = [...availableDates].sort().reverse()[0] ?? today;
  const [leftYM,  setLeftYM]  = useState(() => latestAvailable.slice(0, 7));
  const [hover,   setHover]   = useState('');
  // 'from' phase = next click sets from; 'to' phase = next click sets to
  const [phase,   setPhase]   = useState<'from' | 'to'>('from');

  const rightYM = addMonth(leftYM, 1);

  const handleDayClick = (date: string) => {
    if (!availableDates.has(date)) return;
    if (phase === 'from') {
      onFromChange(date);
      onToChange(date);
      setPhase('to');
    } else {
      if (date < from) {
        // Clicked before current from — restart
        onFromChange(date);
        onToChange(date);
        setPhase('to');
      } else {
        onToChange(date);
        setPhase('from'); // done
      }
    }
  };

  const renderMonth = (ym: string, showPrev: boolean, showNext: boolean) => {
    const [y, m] = ym.split('-').map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const daysInM  = new Date(y, m, 0).getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInM; d++) {
      cells.push(`${ym}-${String(d).padStart(2, '0')}`);
    }

    return (
      <div className="xcal-month">
        <div className="xcal-nav">
          {showPrev ? (
            <button className="xcal-nav-btn" onClick={() => setLeftYM(addMonth(leftYM, -1))}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          ) : <span style={{ width: 28 }} />}
          <span className="xcal-month-label">{monthLabel(ym)}</span>
          {showNext ? (
            <button className="xcal-nav-btn" onClick={() => setLeftYM(addMonth(leftYM, 1))}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ) : <span style={{ width: 28 }} />}
        </div>

        <div className="xcal-grid">
          {DOW.map((d) => <span key={d} className="xcal-dow">{d}</span>)}
          {cells.map((date, i) => {
            if (!date) return <span key={`e${i}`} />;
            const hasData  = availableDates.has(date);
            const isFrom   = date === from;
            const isTo     = date === to;
            const effective = hover && phase === 'to' && hover >= from ? hover : to;
            const inRange  = hasData && date > from && date < effective;
            const isHoverEnd = hover === date && phase === 'to' && date >= from;

            return (
              <button
                key={date}
                className={[
                  'xcal-day',
                  hasData  ? 'has-data'   : '',
                  isFrom   ? 'is-from'    : '',
                  isTo && date !== from ? 'is-to' : '',
                  inRange  ? 'in-range'   : '',
                  isHoverEnd && !isTo ? 'hover-range' : '',
                ].filter(Boolean).join(' ')}
                disabled={!hasData}
                title={hasData ? fmtDateMed(date) : ''}
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => setHover(date)}
                onMouseLeave={() => setHover('')}
              >
                {new Date(date + 'T00:00').getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="xcal-root">
      <div className="xcal-months">
        {renderMonth(leftYM, true, false)}
        {renderMonth(rightYM, false, true)}
      </div>
      <div className="xcal-legend">
        <span className="xcal-legend-dot" style={{ background: 'var(--color-surface-deep)' }} />
        <span>Has records</span>
        <span className="xcal-legend-dot" style={{ background: 'var(--color-primary)', marginLeft: 8 }} />
        <span>Selected</span>
        <span className="xcal-legend-dot" style={{ background: 'rgba(79,111,209,0.15)', marginLeft: 8 }} />
        <span>In range</span>
      </div>
      <p className="xcal-hint">
        {phase === 'from' ? 'Click a highlighted date to set the start of your range.' : 'Now click another date to set the end of the range.'}
      </p>
    </div>
  );
}

/* ─── xlsx export ────────────────────────────────────────── */
const PRIMARY   = 'FF4F6FD1';
const PRIMARY_L = 'FFD6DEF5';
const GRAY_BG   = 'FFF1F5F9';
const WHITE     = 'FFFFFFFF';
const GREEN_FG  = 'FF15803D';
const BLUE_FG   = 'FF1E3A8A';
const ORANGE_FG = 'FF92400E';

function xlFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}
function xlBorder(): Partial<ExcelJS.Borders> {
  const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFE2E8F0' } };
  return { top: s, bottom: s, left: s, right: s };
}

async function exportSessionsXLSX(sessions: LogbookSession[], from: string, to: string): Promise<void> {
  const isSingleDay = from === to;
  const periodLabel = isSingleDay
    ? fmtDateLong(from)
    : `${fmtDateMed(from)} — ${fmtDateMed(to)}`;
  const generated = new Date().toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'CSG-OITS';
  wb.created  = new Date();
  const ws = wb.addWorksheet('Office Duty', { views: [{ state: 'frozen', ySplit: 6 }] });

  const COLS = 9;
  ws.columns = [
    { key: 'no',       width: 6  },
    { key: 'name',     width: 28 },
    { key: 'position', width: 22 },
    { key: 'date',     width: 13 },
    { key: 'checkin',  width: 11 },
    { key: 'checkout', width: 11 },
    { key: 'duration', width: 11 },
    { key: 'status',   width: 14 },
    { key: 'geo',      width: 18 },
  ];

  // ── Title block ──────────────────────────────────────────
  const r1 = ws.addRow(['CSG-OITS — Office Duty Report']);
  ws.mergeCells(1, 1, 1, COLS);
  r1.getCell(1).font = { bold: true, size: 14, color: { argb: WHITE } };
  r1.getCell(1).fill = xlFill(PRIMARY);
  r1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  r1.height = 26;

  const r2 = ws.addRow([`Period: ${periodLabel}`]);
  ws.mergeCells(2, 1, 2, COLS);
  r2.getCell(1).font = { italic: true, size: 11, color: { argb: BLUE_FG } };
  r2.getCell(1).fill = xlFill(PRIMARY_L);
  r2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  r2.height = 20;

  const r3 = ws.addRow([`Generated: ${generated}   ·   Total sessions: ${sessions.length}`]);
  ws.mergeCells(3, 1, 3, COLS);
  r3.getCell(1).font = { size: 10, color: { argb: 'FF64748B' } };
  r3.getCell(1).fill = xlFill(PRIMARY_L);
  r3.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  r3.height = 16;

  ws.addRow([]); // blank spacer row 4

  // ── Column headers (row 5) ────────────────────────────────
  const hdr = ws.addRow(['No.', 'Officer Name', 'Position', 'Date', 'Check-in', 'Check-out', 'Duration', 'Status', 'Location Verified']);
  hdr.height = 22;
  hdr.eachCell((cell) => {
    cell.font      = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill      = xlFill(PRIMARY);
    cell.border    = xlBorder();
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // ── Data rows grouped by date ─────────────────────────────
  let counter = 1;
  let lastDate = '';
  let shade = false;

  for (const s of sessions) {
    if (s.date !== lastDate) {
      const gr = ws.addRow([`${fmtDateLong(s.date)}`]);
      ws.mergeCells(gr.number, 1, gr.number, COLS);
      gr.getCell(1).font      = { bold: true, italic: true, size: 10.5, color: { argb: 'FF475569' } };
      gr.getCell(1).fill      = xlFill(GRAY_BG);
      gr.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      gr.height = 18;
      lastDate = s.date;
      shade = false;
    }

    const dur    = durMin(s.check_in_at, s.check_out_at);
    const status = !s.check_out_at ? 'On Duty' : s.auto_checkout ? 'Auto-closed' : 'Checked Out';
    const rowData = [
      counter++,
      s.officer?.full_name  ?? '—',
      s.officer?.position   ?? '—',
      s.date,
      fmtTime(s.check_in_at),
      s.check_out_at ? fmtTime(s.check_out_at) : '—',
      fmtDur(dur),
      status,
      s.check_in_lat != null ? 'Yes ✓' : 'No',
    ];
    const dr = ws.addRow(rowData);
    dr.height = 18;
    const rowBg = shade ? 'FFF8FAFF' : WHITE;
    shade = !shade;

    dr.eachCell((cell, col) => {
      cell.fill   = xlFill(rowBg);
      cell.border = xlBorder();
      cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left' };
      cell.font   = { size: 10.5 };
    });

    // Status font color
    const statusCell = dr.getCell(8);
    if (status === 'On Duty')     statusCell.font = { size: 10.5, color: { argb: GREEN_FG  }, bold: true };
    if (status === 'Checked Out') statusCell.font = { size: 10.5, color: { argb: BLUE_FG   }, bold: true };
    if (status === 'Auto-closed') statusCell.font = { size: 10.5, color: { argb: ORANGE_FG }, bold: true };

    // Geo font color
    const geoCell = dr.getCell(9);
    geoCell.font = { size: 10.5, color: { argb: s.check_in_lat != null ? GREEN_FG : 'FF94A3B8' } };
  }

  // ── Summary section ───────────────────────────────────────
  ws.addRow([]);

  const byDate = new Map<string, LogbookSession[]>();
  for (const s of sessions) {
    const b = byDate.get(s.date) ?? [];
    b.push(s);
    byDate.set(s.date, b);
  }

  if (!isSingleDay && byDate.size > 1) {
    // Per-day summary table
    const sh = ws.addRow(['Daily Summary', 'Sessions', 'Checked Out', 'Auto-closed', 'Total Hours', '', '', '', '']);
    sh.height = 20;
    [1, 2, 3, 4, 5].forEach((c) => {
      const cell = sh.getCell(c);
      cell.font   = { bold: true, size: 10.5, color: { argb: WHITE } };
      cell.fill   = xlFill(PRIMARY);
      cell.border = xlBorder();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let grandMins = 0;
    let altShade = false;
    for (const [d, ds] of byDate) {
      const mins = ds.reduce((a, s) => a + durMin(s.check_in_at, s.check_out_at), 0);
      grandMins += mins;
      const sr = ws.addRow([
        fmtDateMed(d),
        ds.length,
        ds.filter((s) => !!s.check_out_at && !s.auto_checkout).length,
        ds.filter((s) => s.auto_checkout).length,
        fmtDur(mins),
        '', '', '', '',
      ]);
      sr.height = 17;
      const bg = altShade ? 'FFF8FAFF' : WHITE;
      altShade = !altShade;
      [1, 2, 3, 4, 5].forEach((c) => {
        const cell = sr.getCell(c);
        cell.fill   = xlFill(bg);
        cell.border = xlBorder();
        cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.font   = { size: 10.5 };
      });
    }

    const tot = ws.addRow([
      'TOTAL',
      sessions.length,
      sessions.filter((s) => !!s.check_out_at && !s.auto_checkout).length,
      sessions.filter((s) => s.auto_checkout).length,
      fmtDur(grandMins),
      '', '', '', '',
    ]);
    tot.height = 19;
    [1, 2, 3, 4, 5].forEach((c) => {
      const cell = tot.getCell(c);
      cell.font   = { bold: true, size: 10.5, color: { argb: BLUE_FG } };
      cell.fill   = xlFill(PRIMARY_L);
      cell.border = xlBorder();
      cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
    });
  } else {
    // Single-day summary
    const totalMins = sessions.reduce((a, s) => a + durMin(s.check_in_at, s.check_out_at), 0);
    const summaryRows = [
      ['Checked Out', sessions.filter((s) => !!s.check_out_at && !s.auto_checkout).length],
      ['On Duty',     sessions.filter((s) => !s.check_out_at).length],
      ['Auto-closed', sessions.filter((s) => s.auto_checkout).length],
      ['Total Hours', fmtDur(totalMins)],
    ];
    const sh = ws.addRow(['Summary', 'Count', '', '', '', '', '', '', '']);
    sh.height = 20;
    [1, 2].forEach((c) => {
      const cell = sh.getCell(c);
      cell.font = { bold: true, size: 10.5, color: { argb: WHITE } };
      cell.fill = xlFill(PRIMARY);
      cell.border = xlBorder();
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    summaryRows.forEach(([label, val]) => {
      const sr = ws.addRow([label, val, '', '', '', '', '', '', '']);
      sr.height = 17;
      [1, 2].forEach((c) => {
        const cell = sr.getCell(c);
        cell.fill   = xlFill(WHITE);
        cell.border = xlBorder();
        cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.font   = { size: 10.5 };
      });
    });
  }

  // ── Download ──────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = isSingleDay
    ? `office-duty-${from}.xlsx`
    : `office-duty-${from}-to-${to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Export modal ───────────────────────────────────────── */
function ExportModal({ defaultDate, onClose }: { defaultDate: string; onClose: () => void }) {
  const today = todayStr();
  const [from,          setFrom]          = useState(defaultDate);
  const [to,            setTo]            = useState(defaultDate);
  const [availDates,    setAvailDates]    = useState<Set<string>>(new Set());
  const [loadingMeta,   setLoadingMeta]   = useState(true);
  const [exporting,     setExporting]     = useState(false);
  const [exportError,   setExportError]   = useState('');

  /* Fetch all dates that have records */
  useEffect(() => {
    axios.get<{ dates: string[] }>(`${API}/logbook/admin/dates`, { withCredentials: true })
      .then(({ data }) => {
        const s = new Set(data.dates);
        setAvailDates(s);
        // Default selection: most recent available date
        const sorted = [...s].sort();
        const latest = sorted[sorted.length - 1] ?? today;
        const earliest = sorted[0] ?? today;
        setFrom(earliest);
        setTo(latest);
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, [today]);

  const hasRecords = availDates.size > 0;
  const isValid    = !!from && !!to && from <= to && hasRecords;
  const days       = isValid ? daysBetween(from, to) : 0;

  const handleExport = async () => {
    if (!isValid) return;
    setExporting(true);
    setExportError('');
    try {
      const { data } = await axios.get<LogbookSession[]>(
        `${API}/logbook/admin`,
        { params: { from, to }, withCredentials: true },
      );
      await exportSessionsXLSX(data, from, to);
      onClose();
    } catch {
      setExportError('Could not fetch sessions. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  /* Escape to close */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 16,
          padding: '28px',
          width: '100%',
          maxWidth: 660,
          boxShadow: '0 24px 60px -12px rgba(15,23,41,0.30)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Export Office Duty Records
          </h3>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Select a date range. Only days with recorded sessions are selectable.
            Exports as a formatted <strong>.xlsx</strong> Excel file.
          </p>
        </div>

        {/* Calendar or loader */}
        {loadingMeta ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Loading available dates…
          </p>
        ) : !hasRecords ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No sessions recorded yet. Check in via the office QR first.
          </p>
        ) : (
          <CalendarPicker
            availableDates={availDates}
            from={from} to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        )}

        {/* Selected range chip */}
        {isValid && (
          <div className="xcal-summary">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>
              {days === 1
                ? `Selected: ${fmtDateLong(from)}`
                : `${days} days selected — ${fmtDateMed(from)} to ${fmtDateMed(to)}`
              }
            </span>
          </div>
        )}

        {exportError && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-danger-text, #dc2626)', background: 'var(--color-danger-bg, #fef2f2)', padding: '8px 12px', borderRadius: 8 }}>
            {exportError}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid var(--color-border-soft)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!isValid || exporting || loadingMeta}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: isValid && !exporting ? 'var(--color-primary, #4f6fd1)' : 'var(--color-border, #e2e8f0)',
              color: isValid && !exporting ? '#fff' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 600,
              cursor: isValid && !exporting ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Generating…' : loadingMeta ? 'Loading…' : 'Export Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function AdminLogbook() {
  const [date,          setDate]          = useState(todayStr());
  const [liveSessions,  setLiveSessions]  = useState<LogbookSession[]>([]);
  const [sessions,      setSessions]      = useState<LogbookSession[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [liveLoading,   setLiveLoading]   = useState(true);
  const [actionId,      setActionId]      = useState<string | null>(null);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'all' | 'open' | 'closed'>('all');
  const [lastRefresh,   setLastRefresh]   = useState<Date>(new Date());
  const [showExport,    setShowExport]    = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isToday = date === todayStr();

  /* ── Fetch live roster (today endpoint) ── */
  const fetchLive = useCallback(async () => {
    try {
      const { data } = await axios.get<LogbookSession[]>(`${API}/logbook/today`);
      setLiveSessions(data);
      setLastRefresh(new Date());
    } catch {
      /* silent on live refresh errors */
    } finally {
      setLiveLoading(false);
    }
  }, []);

  /* ── Fetch date-specific sessions (admin endpoint) ── */
  const fetchSessions = useCallback(async (d: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get<LogbookSession[]>(
        `${API}/logbook/admin`,
        { params: { date: d }, withCredentials: true },
      );
      setSessions(data);
    } catch {
      setError('Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Initial load + polling ── */
  useEffect(() => {
    fetchLive();
    pollRef.current = setInterval(fetchLive, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchLive]);

  useEffect(() => { fetchSessions(date); }, [date, fetchSessions]);

  /* ── Actions ── */
  const handleForceCheckout = async (session: LogbookSession) => {
    setActionId(session.id);
    try {
      await axios.post(
        `${API}/logbook/admin/checkout`,
        { session_id: session.id },
        { withCredentials: true },
      );
      const now = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) => s.id === session.id ? { ...s, check_out_at: now } : s),
      );
      setLiveSessions((prev) =>
        prev.map((s) => s.id === session.id ? { ...s, check_out_at: now } : s),
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to check out session.';
      alert(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (session: LogbookSession) => {
    if (!confirm(`Delete session for ${session.officer?.full_name ?? 'this officer'}?`)) return;
    setActionId(session.id);
    try {
      await axios.delete(
        `${API}/logbook/admin/delete`,
        { data: { session_id: session.id }, withCredentials: true },
      );
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      setLiveSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to delete session.';
      alert(msg);
    } finally {
      setActionId(null);
    }
  };

  /* ── Derived data ── */
  const presentSessions = liveSessions.filter((s) => !s.check_out_at);
  const checkedOutToday = liveSessions.filter((s) => !!s.check_out_at && !s.auto_checkout).length;

  const totalOfficeMinutes = liveSessions.reduce((acc, s) => {
    if (s.auto_checkout) return acc;
    return acc + durMin(s.check_in_at, s.check_out_at);
  }, 0);

  const completedSessions = liveSessions.filter((s) => !!s.check_out_at && !s.auto_checkout);
  const avgMin = completedSessions.length > 0
    ? Math.floor(completedSessions.reduce((acc, s) => acc + durMin(s.check_in_at, s.check_out_at), 0) / completedSessions.length)
    : null;

  /* ── Filter sessions for table ── */
  const filteredSessions = sessions.filter((s) => {
    const name = s.officer?.full_name?.toLowerCase() ?? '';
    const pos  = s.officer?.position?.toLowerCase() ?? '';
    const q    = search.toLowerCase();
    if (q && !name.includes(q) && !pos.includes(q)) return false;
    if (statusFilter === 'open'   && s.check_out_at !== null) return false;
    if (statusFilter === 'closed' && s.check_out_at === null) return false;
    return true;
  });

  const dateNav = (delta: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(d.toLocaleDateString('en-CA'));
  };

  return (
    <div className="ad-shell">
      <Sidebar active="logbook" />
      <main className="ad-main">
        <PageHead
          title="Office Duty"
          subtitle="Live attendance from the QR logbook. Officers scan to check in and out — sessions are recorded automatically."
          actions={
            <>
              <button
                className="ad-btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => setShowExport(true)}
                title="Export attendance records as CSV"
              >
                <I.log width="14" height="14" />
                Export
              </button>
              <button
                className="od-qr-btn"
                onClick={() => window.open('/logbook/display', '_blank')}
              >
                <QrIcon />
                Open QR Display
              </button>
            </>
          }
        />

        {/* ── 1. Live roster hero ── */}
        <section className="od-now-panel">
          <div className="od-section-head">
            <div>
              <div className="od-eyebrow">
                <span className="od-eyebrow-dot" />
                Live · Updates every 30s
              </div>
              <h2>
                <em>{presentSessions.length}</em> officer{presentSessions.length !== 1 ? 's' : ''} <em>on duty</em> right now
              </h2>
            </div>
            <span className="od-section-meta">
              Last refreshed {lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {liveLoading ? (
            <div className="od-now-empty">Checking who&apos;s in…</div>
          ) : presentSessions.length === 0 ? (
            <div className="od-now-empty">
              No officers are currently on duty. The office QR display will accept the next check-in.
            </div>
          ) : (
            <div className="od-now-grid">
              {presentSessions.map((s) => (
                <div className="od-now-card" key={s.id}>
                  {s.officer && <OfficerAvatar officer={s.officer} size={44} />}
                  <div className="od-now-body">
                    <div className="od-now-name">{s.officer?.full_name ?? '—'}</div>
                    <div className="od-now-pos">{s.officer?.position ?? ''}</div>
                    <div className="od-now-time">
                      <CheckInIcon />
                      {fmtTime(s.check_in_at)}
                      <span className="od-dur">· {fmtDur(durMin(s.check_in_at, null))}</span>
                    </div>
                  </div>
                  <span className="od-now-live">In office</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 2. Date controls ── */}
        <div className="od-controls">
          <div className="od-date">
            <button className="od-date-arrow" onClick={() => dateNav(-1)} title="Previous day">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <I.calendar width="14" height="14" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button className="od-date-arrow" onClick={() => dateNav(1)} title="Next day">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          <button
            className={`od-day-chip${isToday ? ' is-active' : ''}`}
            onClick={() => setDate(todayStr())}
          >
            Today
          </button>
          <div className="od-spacer" />
          <button
            className="ad-icon-btn"
            title="Refresh"
            onClick={() => { fetchLive(); fetchSessions(date); }}
          >
            <I.refresh width="14" height="14" />
          </button>
        </div>

        {/* ── 3. KPI tiles ── */}
        <div className="od-kpi-row">
          <div className="od-kpi od-kpi--accent">
            <div className="od-kpi-label">On duty now</div>
            <div className="od-kpi-value">{presentSessions.length}</div>
            <div className="od-kpi-sub">Open sessions across all committees</div>
          </div>
          <div className="od-kpi">
            <div className="od-kpi-label">Checked out today</div>
            <div className="od-kpi-value">{checkedOutToday}</div>
            <div className="od-kpi-sub">Completed sessions</div>
          </div>
          <div className="od-kpi">
            <div className="od-kpi-label">Office hours today</div>
            <div className="od-kpi-value">
              {Math.floor(totalOfficeMinutes / 60)}
              <em>h {totalOfficeMinutes % 60}m</em>
            </div>
            <div className="od-kpi-sub">Aggregated check-in time</div>
          </div>
          <div className="od-kpi">
            <div className="od-kpi-label">Avg session length</div>
            <div className="od-kpi-value">
              {avgMin !== null ? (
                <>{Math.floor(avgMin / 60)}<em>h {avgMin % 60}m</em></>
              ) : (
                <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>—</span>
              )}
            </div>
            <div className="od-kpi-sub">Across today&apos;s closed sessions</div>
          </div>
        </div>

        {/* ── 4. Filter toolbar ── */}
        <div className="ad-toolbar">
          <div className="ad-search">
            <I.search width="14" height="14" />
            <input
              placeholder="Search by officer name or position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ad-filter-group">
            <span className="ad-filter-label">Status</span>
            {(['all', 'open', 'closed'] as const).map((v) => (
              <button
                key={v}
                className={`ad-filter-chip${statusFilter === v ? ' is-active' : ''}`}
                onClick={() => setStatusFilter(v)}
              >
                {v === 'all' ? 'All' : v === 'open' ? 'On duty' : 'Checked out'}
              </button>
            ))}
          </div>
        </div>

        {/* ── 5. Sessions table ── */}
        <section className="ad-card" style={{ overflow: 'hidden', padding: 0 }}>
          <header style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border-soft)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                SESSIONS
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                {isToday ? `All check-in sessions — ${fmtDate(date)}` : `Sessions — ${fmtDate(date)}`}
              </h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              {isToday && ` · ${presentSessions.length} currently present`}
            </span>
          </header>

          {error && (
            <p style={{ padding: '12px 20px', color: 'var(--color-danger-text)', fontSize: 13 }}>{error}</p>
          )}

          {loading ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: 14 }}>Loading sessions…</p>
          ) : filteredSessions.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: 14 }}>
              {sessions.length === 0 ? 'No check-in sessions recorded for this date.' : 'No sessions match the current filter.'}
            </p>
          ) : (
            <table className="ad-table">
              <colgroup>
                <col style={{ width: 44 }} />
                <col style={{ minWidth: 200 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 170 }} />
              </colgroup>
              <thead>
                <tr>
                  <th />
                  <th>Officer</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th className="ad-th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr
                    key={s.id}
                    className={!s.check_out_at ? 'is-pinned' : ''}
                  >
                    {/* Avatar */}
                    <td>
                      {s.officer
                        ? <MiniAvatar officer={s.officer} />
                        : <span className="ad-mini-avatar" />
                      }
                    </td>

                    {/* Officer info */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="ad-title-link" style={{ cursor: 'default' }}>
                          {s.officer?.full_name ?? '—'}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                          {s.officer?.position ?? ''}
                        </span>
                      </div>
                    </td>

                    {/* Check-in */}
                    <td>
                      <div className="od-time-cell">
                        <span>{fmtTime(s.check_in_at)}</span>
                        <span className="od-time-cell-rel">via QR · device verified</span>
                      </div>
                    </td>

                    {/* Check-out */}
                    <td>
                      <div className="od-time-cell">
                        <span style={{ color: s.check_out_at == null ? 'var(--color-text-hint)' : undefined }}>
                          {s.check_out_at ? fmtTime(s.check_out_at) : '—'}
                        </span>
                        {s.auto_checkout && (
                          <span className="od-time-cell-rel" style={{ color: 'var(--color-warning-text)' }}>
                            auto-closed at midnight
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Duration */}
                    <td>
                      <span className="od-duration">
                        {fmtDur(durMin(s.check_in_at, s.check_out_at))}
                      </span>
                    </td>

                    {/* Status pill */}
                    <td>
                      {!s.check_out_at && <span className="od-status-open">On duty</span>}
                      {s.check_out_at && !s.auto_checkout && <span className="od-status-out">Checked out</span>}
                      {s.check_out_at && s.auto_checkout && <span className="od-status-auto">Auto-closed</span>}
                    </td>

                    {/* Geo */}
                    <td>
                      {s.check_in_lat != null
                        ? (
                          <span className="od-geo" title={`${s.check_in_lat}, ${s.check_in_lng}`}>
                            <GeoIcon />Verified
                          </span>
                        ) : (
                          <span className="od-geo is-off">
                            <GeoIcon />Not captured
                          </span>
                        )
                      }
                    </td>

                    {/* Actions */}
                    <td className="ad-actions">
                      {!s.check_out_at && (
                        <button
                          className="od-force-btn"
                          disabled={actionId === s.id}
                          onClick={() => handleForceCheckout(s)}
                          title="Force check-out"
                        >
                          <CheckOutIcon />
                          {actionId === s.id ? '…' : 'Force check-out'}
                        </button>
                      )}
                      <button
                        className="ad-icon-btn ad-icon-btn--danger"
                        disabled={actionId === s.id}
                        onClick={() => handleDelete(s)}
                        title="Delete session"
                      >
                        <I.trash width="14" height="14" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* Export date-range modal */}
      {showExport && (
        <ExportModal
          defaultDate={date}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
