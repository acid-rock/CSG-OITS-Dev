import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../_shared/admin-list.css';
import Sidebar from '../_shared/Sidebar';

const API = import.meta.env.VITE_API_URL as string;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface CommitteeOption {
  id: string;
  name: string;
}

interface DutyEntry {
  id: string;
  duty_date: string;
  notes: string | null;
  committee_id: string;
  committees: {
    id: string;
    name: string;
    chair_name: string | null;
    cover_image_url: string | null;
  } | null;
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

export default function AdminOfficeDuty() {
  const today = todayStr();
  const now   = new Date();

  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const [duties, setDuties]     = useState<DutyEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* Add-duty modal state */
  const [addOpen, setAddOpen]           = useState(false);
  const [committees, setCommittees]     = useState<CommitteeOption[]>([]);
  const [addCommitteeId, setAddCommitteeId] = useState('');
  const [addDate, setAddDate]           = useState('');
  const [addNotes, setAddNotes]         = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErr, setAddErr]             = useState('');

  /* ── Fetch duties for the visible month ── */
  const fetchDuties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const monthStr = `${year}-${pad2(month + 1)}`;
      const { data } = await axios.get<{ data: DutyEntry[]; total: number }>(
        `${API}/office-duties/admin?month=${monthStr}`,
        { withCredentials: true },
      );
      setDuties(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError('Could not load duty records.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchDuties(); }, [fetchDuties]);

  /* ── Fetch committees for add modal ── */
  const fetchCommittees = useCallback(async () => {
    if (committees.length > 0) return;
    try {
      const { data } = await axios.get<CommitteeOption[]>(`${API}/committees/?status=active`, {
        withCredentials: true,
      });
      setCommittees(Array.isArray(data) ? data : []);
      if (data.length > 0) setAddCommitteeId(data[0].id);
    } catch { /* silent */ }
  }, [committees.length]);

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  /* ── Delete duty entry ── */
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/office-duties/admin/delete`, {
        data: { id },
        withCredentials: true,
      });
      setDuties((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Failed to delete duty entry.');
    }
  };

  /* ── Add duty ── */
  const handleAdd = async () => {
    if (!addCommitteeId || !addDate) return;
    setAddSubmitting(true);
    setAddErr('');
    try {
      const { data } = await axios.post<DutyEntry>(
        `${API}/office-duties/admin/add`,
        { committee_id: addCommitteeId, duty_date: addDate, notes: addNotes.trim() || null },
        { withCredentials: true },
      );
      // Only add to local state if the date falls in the current visible month
      const dutyMonth = `${year}-${pad2(month + 1)}`;
      if (addDate.startsWith(dutyMonth)) {
        // Attach committee info from the select
        const committee = committees.find((c) => c.id === addCommitteeId);
        const enriched: DutyEntry = {
          ...data,
          committees: committee
            ? { id: committee.id, name: committee.name, chair_name: null, cover_image_url: null }
            : null,
        };
        setDuties((prev) => [...prev, enriched]);
      }
      setAddOpen(false);
      setAddDate('');
      setAddNotes('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to add duty.';
      setAddErr(msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  /* ── Calendar grid ── */
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  /* Group duties by date for easy lookup */
  const dutyMap = new Map<string, DutyEntry[]>();
  for (const d of duties) {
    const arr = dutyMap.get(d.duty_date) ?? [];
    arr.push(d);
    dutyMap.set(d.duty_date, arr);
  }

  const selectedEntries = selectedDate ? (dutyMap.get(selectedDate) ?? []) : [];

  return (
    <div className="ad-shell">
      <Sidebar active="office" />
      <main className="ad-main">
        {/* Page head */}
        <header style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
            Operations
          </p>
          <h1 style={{ margin: '2px 0 4px', fontSize: '1.5rem', fontWeight: 800, color: '#0f1729' }}>
            Office Duty Schedule
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
            View and manage committee duty filings for the CSG office.
          </p>
        </header>

        {error && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--color-danger-surface, #fef2f2)', color: 'var(--color-danger-text, #991b1b)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Calendar */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-soft)', borderRadius: 14, padding: '1.25rem' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={prevMonth} style={navBtnStyle}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{MONTHS[month]} {year}</span>
              <button onClick={nextMonth} style={navBtnStyle}>›</button>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {DAY_LABELS.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', padding: '3px 0 5px' }}>
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} />;
                const dateStr  = toDateStr(year, month, day);
                const entries  = dutyMap.get(dateStr) ?? [];
                const isToday  = dateStr === today;
                const isSelected = dateStr === selectedDate;
                const hasDuty  = entries.length > 0;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    style={{
                      padding: '6px 2px 4px',
                      borderRadius: 7,
                      cursor: 'pointer',
                      border: isSelected
                        ? '1.5px solid var(--color-primary)'
                        : isToday
                        ? '1.5px solid var(--color-primary)'
                        : '1.5px solid transparent',
                      background: isSelected
                        ? 'rgba(79,111,209,0.1)'
                        : 'transparent',
                      textAlign: 'center',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: isToday || isSelected ? 700 : 500, color: '#0f1729', display: 'block' }}>
                      {day}
                    </span>
                    {/* Duty pills */}
                    {hasDuty && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                        {entries.slice(0, 2).map((e) => (
                          <span key={e.id} style={{
                            fontSize: 8, background: 'var(--color-primary)', color: '#fff',
                            borderRadius: 3, padding: '1px 4px', lineHeight: 1.4,
                            maxWidth: 38, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {e.committees?.name ?? '?'}
                          </span>
                        ))}
                        {entries.length > 2 && (
                          <span style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>+{entries.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add duty button */}
            <button
              onClick={() => { fetchCommittees(); setAddOpen(true); }}
              style={{
                marginTop: 14, width: '100%', padding: '8px',
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              }}
            >
              + Add Duty Entry
            </button>
          </div>

          {/* Detail panel */}
          <div>
            {!selectedDate ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 14, padding: '2rem 0' }}>
                Click a date on the calendar to see committee duties.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f1729' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </h3>
                  {selectedDate === today && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(79,111,209,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                      Today
                    </span>
                  )}
                </div>

                {selectedEntries.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No duty filed for this date.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedEntries.map((entry) => (
                      <li key={entry.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'var(--color-surface)', border: '1px solid var(--color-border-soft)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1729' }}>
                            {entry.committees?.name ?? '—'}
                          </div>
                          {entry.committees?.chair_name && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                              Chair: {entry.committees.chair_name}
                            </div>
                          )}
                          {entry.notes && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-danger-text, #991b1b)',
                            fontSize: 18, lineHeight: 1, padding: '2px 6px',
                          }}
                          title="Remove duty entry"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {/* Loading state */}
            {loading && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 8 }}>Loading…</p>
            )}
          </div>
        </div>

        {/* Add Duty Modal */}
        {addOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}>
            <div style={{
              background: '#fff', borderRadius: 14, padding: '1.5rem',
              width: '100%', maxWidth: 420,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 700, color: '#0f1729' }}>
                Add Duty Entry
              </h3>

              {addErr && (
                <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--color-danger-surface, #fef2f2)', color: 'var(--color-danger-text, #991b1b)', fontSize: 12.5 }}>
                  {addErr}
                </div>
              )}

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Committee
              </label>
              <select
                value={addCommitteeId}
                onChange={(e) => setAddCommitteeId(e.target.value)}
                style={{
                  width: '100%', marginBottom: 12, padding: '8px 10px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  background: '#fff',
                }}
              >
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Duty Date
              </label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                style={{
                  width: '100%', marginBottom: 12, padding: '8px 10px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Notes (optional)
              </label>
              <textarea
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Optional details about this duty entry"
                style={{
                  width: '100%', marginBottom: 14, padding: '8px 10px',
                  border: '1.5px solid #e5e7eb', borderRadius: 8, resize: 'vertical',
                  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setAddOpen(false); setAddErr(''); setAddDate(''); setAddNotes(''); }}
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
                  disabled={addSubmitting || !addCommitteeId || !addDate}
                  onClick={handleAdd}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--color-primary, #4f6fd1)', color: '#fff',
                    border: 'none', borderRadius: 8,
                    cursor: addSubmitting || !addCommitteeId || !addDate ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                    opacity: addSubmitting ? 0.7 : 1,
                  }}
                >
                  {addSubmitting ? 'Adding…' : 'Add Duty'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30, height: 30, border: '1.5px solid var(--color-border-soft)',
  borderRadius: 7, background: 'var(--color-surface)', cursor: 'pointer',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--color-text-primary)',
};
