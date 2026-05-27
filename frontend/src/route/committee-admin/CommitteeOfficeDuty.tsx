/**
 * CommitteeOfficeDuty — calendar panel for committees to file office duty dates.
 *
 * Reads committee_duty_id, committee_duty_name, and committee_duty_pin from
 * sessionStorage (set by CommitteeLogin when a duty PIN is verified).
 *
 * If the user reached this panel via a content-session (no committee_duty_id),
 * a soft message is shown rather than an error redirect.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL as string;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface DutyEntry {
  id: string;
  duty_date: string;   // YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

interface NotesModal {
  date: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function todayStr(): string {
  const d = new Date();
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CommitteeOfficeDuty() {
  const committeeId   = sessionStorage.getItem('committee_duty_id') ?? '';
  const committeeName = sessionStorage.getItem('committee_duty_name') ?? '';
  const dutyPin       = sessionStorage.getItem('committee_duty_pin') ?? '';

  const today = todayStr();

  const [year, setYear]   = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-based

  const [duties, setDuties]     = useState<DutyEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetchErr, setFetchErr] = useState('');

  const [notesModal, setNotesModal] = useState<NotesModal | null>(null);
  const [notesText, setNotesText]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionErr, setActionErr]   = useState('');

  /* ── Fetch duties for the current month ── */
  const fetchDuties = useCallback(async () => {
    if (!committeeId) return;
    setLoading(true);
    setFetchErr('');
    try {
      const monthStr = `${year}-${pad2(month + 1)}`;
      const { data } = await axios.get<DutyEntry[]>(
        `${API}/office-duties/?month=${monthStr}&committee_id=${committeeId}`,
      );
      setDuties(Array.isArray(data) ? data : []);
    } catch {
      setFetchErr('Could not load duty records.');
    } finally {
      setLoading(false);
    }
  }, [committeeId, year, month]);

  useEffect(() => { fetchDuties(); }, [fetchDuties]);

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  /* ── Helpers ── */
  const isFiled = (dateStr: string) => duties.some((d) => d.duty_date === dateStr);

  /* ── Check-in (file duty) ── */
  const handleCheckin = async (date: string, notes: string) => {
    setSubmitting(true);
    setActionErr('');
    try {
      const { data } = await axios.post<DutyEntry>(`${API}/office-duties/checkin`, {
        committee_id: committeeId,
        duty_date: date,
        notes: notes.trim() || null,
        duty_pin: dutyPin,
      });
      setDuties((prev) => [...prev, data]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to file duty.';
      setActionErr(msg);
    } finally {
      setSubmitting(false);
      setNotesModal(null);
      setNotesText('');
    }
  };

  /* ── Check-out (remove duty) ── */
  const handleCheckout = async (date: string) => {
    setActionErr('');
    try {
      await axios.delete(`${API}/office-duties/checkout`, {
        data: { committee_id: committeeId, duty_date: date, duty_pin: dutyPin },
      });
      setDuties((prev) => prev.filter((d) => d.duty_date !== date));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to remove duty.';
      setActionErr(msg);
    }
  };

  const handleCellClick = (dateStr: string) => {
    if (dateStr < today) return; // past dates not clickable
    if (isFiled(dateStr)) {
      handleCheckout(dateStr);
    } else {
      setNotesModal({ date: dateStr });
      setNotesText('');
    }
  };

  /* ── Calendar grid data ── */
  const firstDay   = new Date(year, month, 1).getDay(); // 0=Su
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build cells: nulls for leading empty slots, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  /* ── No duty session ── */
  if (!committeeId) {
    return (
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1rem', padding: '2rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
          stroke="var(--color-primary, #4f6fd1)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f1729' }}>
          Duty session not active
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', maxWidth: 340 }}>
          To file office duty, please sign in using the{' '}
          <strong>File Office Duty</strong> tab on the login page.
        </p>
        <Link
          to="/committee/login"
          style={{
            marginTop: 8, padding: '0.6rem 1.4rem',
            background: 'var(--color-primary, #4f6fd1)', color: '#fff',
            borderRadius: 8, fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Go to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="ad-main" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted, #6b7280)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Office Duty
        </p>
        <h1 style={{ margin: '2px 0 4px', fontSize: '1.5rem', fontWeight: 800, color: '#0f1729' }}>
          {committeeName}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted, #6b7280)' }}>
          Click a date to file or remove your committee's office duty.
        </p>
      </header>

      {/* Action error */}
      {actionErr && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 8,
          background: 'var(--color-danger-surface, #fef2f2)',
          color: 'var(--color-danger-text, #991b1b)', fontSize: 13,
        }}>
          {actionErr}
        </div>
      )}

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15, minWidth: 140, textAlign: 'center' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted, #6b7280)', fontSize: 13 }}>Loading…</p>
      ) : fetchErr ? (
        <p style={{ color: 'var(--color-danger-text, #991b1b)', fontSize: 13 }}>{fetchErr}</p>
      ) : (
        <>
          {/* Calendar grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4, maxWidth: 420,
          }}>
            {/* Day headers */}
            {DAY_LABELS.map((d) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: 'var(--color-text-muted, #9ca3af)', padding: '4px 0',
              }}>
                {d}
              </div>
            ))}

            {/* Date cells */}
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const dateStr  = toDateStr(year, month, day);
              const filed    = isFiled(dateStr);
              const isPast   = dateStr < today;
              const isToday  = dateStr === today;

              let bg    = 'var(--color-surface, #fff)';
              let color = 'var(--color-text-primary, #0f1729)';
              let border = '1.5px solid var(--color-border-soft, #e5e7eb)';
              let cursor = 'pointer';

              if (filed) {
                bg = 'var(--color-primary, #4f6fd1)';
                color = '#fff';
                border = '1.5px solid var(--color-primary, #4f6fd1)';
              } else if (isPast) {
                bg = 'transparent';
                color = 'var(--color-text-hint, #9ca3af)';
                border = '1.5px solid transparent';
                cursor = 'default';
              } else if (isToday) {
                border = '1.5px solid var(--color-primary, #4f6fd1)';
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && handleCellClick(dateStr)}
                  title={filed ? 'Click to remove duty' : isPast ? '' : 'Click to file duty'}
                  style={{
                    textAlign: 'center', padding: '8px 4px',
                    borderRadius: 8, fontSize: 13, fontWeight: filed || isToday ? 700 : 500,
                    background: bg, color, border, cursor,
                    transition: 'background 0.15s, border 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11.5, color: 'var(--color-text-muted, #6b7280)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-primary, #4f6fd1)', display: 'inline-block' }} />
              Filed (click to remove)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid var(--color-primary, #4f6fd1)', display: 'inline-block' }} />
              Today
            </span>
          </div>

          {/* Filed duties list */}
          {duties.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f1729', margin: '0 0 10px' }}>
                Filed duty dates — {MONTHS[month]} {year}
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {duties
                  .slice()
                  .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
                  .map((entry) => (
                    <li key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: 'var(--color-surface, #fff)',
                      border: '1px solid var(--color-border-soft, #e5e7eb)',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 13, minWidth: 90, color: '#0f1729' }}>
                        {new Date(entry.duty_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      {entry.notes && (
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted, #6b7280)', flex: 1 }}>
                          {entry.notes}
                        </span>
                      )}
                      <button
                        onClick={() => handleCheckout(entry.duty_date)}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--color-danger-text, #991b1b)',
                          fontSize: 16, lineHeight: 1, padding: '2px 4px',
                        }}
                        title="Remove duty"
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Notes modal */}
      {notesModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '1.5rem',
            width: '100%', maxWidth: 400,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f1729' }}>
              File Office Duty
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
              {new Date(notesModal.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Available 9am–4pm, contact rep: 09XX-XXX-XXXX"
              rows={3}
              maxLength={500}
              style={{
                width: '100%', resize: 'vertical', border: '1.5px solid #e5e7eb',
                borderRadius: 8, padding: '8px 10px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setNotesModal(null); setNotesText(''); }}
                style={{
                  padding: '0.5rem 1rem', border: '1.5px solid #e5e7eb',
                  borderRadius: 8, background: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit', color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCheckin(notesModal.date, notesText)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary, #4f6fd1)', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Filing…' : 'Confirm Duty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 32, height: 32, border: '1.5px solid var(--color-border-soft, #e5e7eb)',
  borderRadius: 8, background: 'var(--color-surface, #fff)',
  cursor: 'pointer', fontSize: 18, lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--color-text-primary, #0f1729)',
};
