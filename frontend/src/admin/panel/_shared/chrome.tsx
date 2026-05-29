import React from 'react';
import type { ReactNode } from 'react';
import { I } from './icons';

/* ── PageHead ───────────────────────────────────────────────── */
interface PageHeadProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}
export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <header className="ad-page-head">
      <div className="ad-page-head-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="ad-page-actions">{actions}</div>}
    </header>
  );
}

/* ── Tabs ───────────────────────────────────────────────────── */
interface TabItem { label: string; count?: number; active?: boolean; }
interface TabsProps {
  items: TabItem[];
  hint?: string;
  onTabChange?: (label: string) => void;
}
export function Tabs({ items, hint, onTabChange }: TabsProps) {
  return (
    <div className="ad-tabs">
      {items.map((t) => (
        <button
          key={t.label}
          className={`ad-tab${t.active ? ' is-active' : ''}`}
          onClick={() => onTabChange?.(t.label)}
        >
          {t.label}
          {t.count != null && <span className="ad-tab-count">{t.count}</span>}
        </button>
      ))}
      <span className="ad-tab-spacer" />
      {hint && <span className="ad-tab-hint">{hint}</span>}
    </div>
  );
}

/* ── Toolbar ────────────────────────────────────────────────── */
interface FilterItem {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}
interface ToolbarProps {
  placeholder: string;
  search?: string;
  onSearch?: (v: string) => void;
  filters?: FilterItem[];
  /** Current sort value — passed as the <select> value */
  sortValue?: string;
  /** Options for the sort dropdown. Defaults to Newest / Oldest first. */
  sortOptions?: { value: string; label: string }[];
  showSort?: boolean;
  onSortChange?: (value: string) => void;
  /** @deprecated Use onSortChange instead */
  onSortToggle?: () => void;
  onRefresh?: () => void;
  /** Inline custom filter elements rendered between search and end controls */
  children?: ReactNode;
}
const DEFAULT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export function Toolbar({
  placeholder,
  search = '',
  onSearch,
  filters = [],
  sortValue = 'newest',
  sortOptions = DEFAULT_SORT_OPTIONS,
  showSort = true,
  onSortChange,
  onRefresh,
  children,
}: ToolbarProps) {
  return (
    <div className="ad-toolbar">
      <div className="ad-search">
        <I.search width="14" height="14" />
        <input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      {filters.length > 0 && (
        <div className="ad-filter-group">
          <span className="ad-filter-label">Filter</span>
          {filters.map((f, i) => (
            <button
              key={i}
              className={`ad-filter-chip${f.active ? ' is-active' : ''}`}
              onClick={f.onClick}
            >
              {f.icon}
              {f.label}
              {f.active ? <I.x width="11" height="11" /> : <I.chev width="11" height="11" />}
            </button>
          ))}
        </div>
      )}
      {children}
      <div className="ad-toolbar-end">
        {showSort && (
          <>
            <span className="ad-sort-label">Sort by</span>
            <select
              className="ad-sort-select"
              value={sortValue}
              onChange={(e) => onSortChange?.(e.target.value)}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        )}
        <button className="ad-icon-btn" title="Refresh" onClick={onRefresh}>
          <I.refresh width="14" height="14" />
        </button>
      </div>
    </div>
  );
}

/* ── BulkBar ────────────────────────────────────────────────── */
type BulkAction = 'Pin' | 'Archive' | 'Delete' | 'Restore' | 'Export';
interface BulkBarProps {
  count: number;
  actions?: BulkAction[];
  handlers?: Partial<Record<BulkAction, () => void>>;
  onClear?: () => void;
}
const BULK_ICONS: Record<BulkAction, (p: Record<string, unknown>) => React.ReactElement> = {
  Pin:     I.pin,
  Archive: I.archive,
  Delete:  I.trash,
  Restore: I.restore,
  Export:  I.download,
};

export function BulkBar({ count, actions = ['Archive', 'Delete'], handlers = {}, onClear }: BulkBarProps) {
  if (count === 0) return null;
  return (
    <div className="ad-bulk-bar">
      <span className="ad-bulk-count">{count} selected</span>
      <span className="ad-bulk-divider" />
      {actions.map((a) => {
        const Icon = BULK_ICONS[a] ?? I.edit;
        const danger = a === 'Delete';
        return (
          <button
            key={a}
            className={`ad-bulk-btn${danger ? ' ad-bulk-btn--danger' : ''}`}
            onClick={handlers[a]}
          >
            <Icon width="12" height="12" />{a}
          </button>
        );
      })}
      <span className="ad-bulk-spacer" />
      <button className="ad-bulk-clear" onClick={onClear}>
        <I.x width="11" height="11" />Clear
      </button>
    </div>
  );
}

/* ── TableFoot ──────────────────────────────────────────────── */
interface TableFootProps {
  shown?: string;
  total: number;
  label?: string;
}
export function TableFoot({ shown = '1–8', total, label = 'records' }: TableFootProps) {
  return (
    <footer className="ad-table-foot">
      <span className="ad-foot-count">
        Showing <strong>{shown}</strong> of <strong>{total}</strong> {label}
      </span>
      <div className="ad-foot-pager">
        <button className="ad-page-btn" disabled>‹ Previous</button>
        <button className="ad-page-btn is-active">1</button>
        <button className="ad-page-btn">Next ›</button>
      </div>
    </footer>
  );
}
