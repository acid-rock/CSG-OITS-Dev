export const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const shortId = (uuid: string | null | undefined): string =>
  uuid ? uuid.substring(0, 8) + '…' : '—';

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

export const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

export const stripHtml = (html: string): string =>
  html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();

export const formatTypeLabel = (str: string): string =>
  str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

export const purgesIn = (deletedAt: string): string => {
  const days = Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000));
  return days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Philippine academic year for a date (Aug Y → Jul Y+1).
 * Jan–Jul falls in the SECOND semester of the year that started the prior August.
 * @example academicYear(new Date('2026-05-21')) // "2025–2026"
 */
export function academicYear(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  const yr = d.getFullYear();
  const mo = d.getMonth(); // 0 = Jan
  const startYear = mo < 7 ? yr - 1 : yr;
  return `${startYear}–${startYear + 1}`;
}

/* Deterministic gradient pair from a string */
const GRAD_PALETTE: [string, string][] = [
  ['#1e3a8a', '#3b5fbc'], ['#7c2d12', '#dc2626'], ['#1e293b', '#475569'],
  ['#3b5fbc', '#8aaae0'], ['#0f766e', '#5eb5af'], ['#92400e', '#a87c2d'],
  ['#475569', '#94a3b8'], ['#7c2d12', '#ea580c'], ['#2c4ba0', '#4f6fd1'],
  ['#1e3a8a', '#4f6fd1'],
];

/**
 * Download an array of objects as a CSV file.
 * @param rows   Array of plain objects (all values stringified)
 * @param filename  Desired filename without extension (e.g. "announcements")
 */
export const downloadCSV = (rows: Record<string, unknown>[], filename: string): void => {
  if (!rows.length) return;
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const gradientFor = (key: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return GRAD_PALETTE[Math.abs(hash) % GRAD_PALETTE.length];
};
