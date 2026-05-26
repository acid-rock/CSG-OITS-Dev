import './reservation-calendar.css';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type DateStatus = 'past' | 'available' | 'partial' | 'full';

export interface AdminDot {
  tone: 'pending' | 'approved';
}

interface ReservationCalendarProps {
  year: number;
  month: number; // 0-based (Jan = 0)
  onMonthChange: (year: number, month: number) => void;
  /** 'user' (default) = colored availability tiles; 'admin-dots' = compact dots for admin */
  variant?: 'user' | 'admin-dots';

  /* user variant ----------------------------------------------------------- */
  getDateStatus?: (dateStr: string) => DateStatus;
  /** Borrow date (range start). Replaces the old single selectedDate. */
  rangeStart?: string | null;
  /** Return date (range end). Dates between start and end get in-range styling. */
  rangeEnd?: string | null;
  onSelectDate?: (dateStr: string) => void;

  /* admin-dots variant ----------------------------------------------------- */
  getDots?: (dateStr: string) => AdminDot[];
  /** Single highlighted date for admin-dots variant */
  selectedDate?: string | null;
  onDateClick?: (dateStr: string) => void;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildCells(year: number, month: number): (string | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array<null>(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function ReservationCalendar({
  year,
  month,
  onMonthChange,
  variant = 'user',
  getDateStatus,
  rangeStart,
  rangeEnd,
  onSelectDate,
  getDots,
  selectedDate,
  onDateClick,
}: ReservationCalendarProps) {
  const cells = buildCells(year, month);
  const today = new Date().toISOString().split('T')[0];

  const prevM = () =>
    month === 0 ? onMonthChange(year - 1, 11) : onMonthChange(year, month - 1);
  const nextM = () =>
    month === 11 ? onMonthChange(year + 1, 0) : onMonthChange(year, month + 1);

  return (
    <div className={`rc-wrap${variant === 'admin-dots' ? ' rc-wrap--admin-dots' : ''}`}>
      {/* Month nav */}
      <div className="rc-nav">
        <button className="rc-nav-btn" onClick={prevM} aria-label="Previous month" type="button">
          ‹
        </button>
        <span className="rc-nav-label">
          {MONTHS[month]} {year}
        </span>
        <button className="rc-nav-btn" onClick={nextM} aria-label="Next month" type="button">
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="rc-weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="rc-weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="rc-grid">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="rc-tile rc-tile--empty" />;

          const dayNum = parseInt(cell.split('-')[2], 10);
          const isToday = cell === today;
          const todayStyle = isToday ? { textDecoration: 'underline' as const } : undefined;

          /* ── admin-dots variant ── */
          if (variant === 'admin-dots') {
            const isPast = cell < today;
            const isSelected = cell === selectedDate;
            const dots = getDots?.(cell) ?? [];
            return (
              <button
                key={cell}
                type="button"
                className={[
                  'rc-tile',
                  isPast ? 'rc-tile--past' : '',
                  isSelected ? 'rc-tile--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={!isPast ? () => onDateClick?.(cell) : undefined}
                disabled={isPast}
                aria-label={cell}
              >
                <span style={isToday && !isSelected ? todayStyle : undefined}>{dayNum}</span>
                {dots.length > 0 && (
                  <div className="rc-dots">
                    {dots.slice(0, 4).map((dot, di) => (
                      <span key={di} className={`rc-dot rc-dot--${dot.tone}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          }

          /* ── user variant ── */
          const status = getDateStatus?.(cell) ?? 'available';
          const isDisabled = status === 'past' || status === 'full';

          // Range class logic
          const isRangeStart = rangeStart ? cell === rangeStart : false;
          const isRangeEnd   = rangeEnd   ? cell === rangeEnd   : false;
          const isInRange    =
            rangeStart && rangeEnd && cell > rangeStart && cell < rangeEnd;

          let tileClass: string;
          if (isRangeStart) {
            tileClass = 'rc-tile rc-tile--range-start';
          } else if (isRangeEnd) {
            tileClass = 'rc-tile rc-tile--range-end';
          } else if (isInRange) {
            tileClass = 'rc-tile rc-tile--in-range';
          } else {
            // For in-range tiles with 'full' status the range warning will be shown
            // in the parent, but we still render them visually with their status
            tileClass = `rc-tile rc-tile--${status}`;
          }

          return (
            <button
              key={cell}
              type="button"
              className={tileClass}
              onClick={!isDisabled ? () => onSelectDate?.(cell) : undefined}
              disabled={isDisabled && !isInRange}
              aria-label={`${cell} — ${status}`}
            >
              <span style={isToday && !isRangeStart && !isRangeEnd ? todayStyle : undefined}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend — user variant only */}
      {variant === 'user' && (
        <div className="rc-legend">
          <div className="rc-legend-item">
            <span
              className="rc-legend-swatch"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-soft, #eef0f5)' }}
            />
            Available
          </div>
          <div className="rc-legend-item">
            <span className="rc-legend-swatch" style={{ background: 'var(--color-warning-bg, #fef3c7)' }} />
            Partially reserved
          </div>
          <div className="rc-legend-item">
            <span className="rc-legend-swatch" style={{ background: 'rgba(239,68,68,0.10)' }} />
            Fully booked
          </div>
          <div className="rc-legend-item">
            <span className="rc-legend-swatch" style={{ background: 'var(--color-primary, #4f6fd1)' }} />
            Selected / In range
          </div>
        </div>
      )}
    </div>
  );
}
