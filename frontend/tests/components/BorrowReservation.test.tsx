/**
 * BorrowReservation component integration tests.
 *
 * Design notes:
 * - NO fake timers: vi.useFakeTimers() blocks waitFor() because waitFor
 *   uses setTimeout internally. Real timers are used throughout.
 * - Test dates are anchored to the NEXT calendar month (always 1 "Next ›"
 *   click away) so they're always in the future regardless of when the
 *   tests run. All three dates (borrow 5th, conflict 8th, return 12th)
 *   live in the same month, avoiding multi-month navigation.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import BorrowReservation from '../../src/route/borrow/BorrowReservation';
import type { AvailabilityEntry } from '../../src/route/borrow/BorrowReservation';

// ── React Router mock ─────────────────────────────────────────────────────────
// Overrides the global setup.ts mock to inject useParams with a test equipment id.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'equip-001' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/borrow/equip-001', search: '', hash: '' }),
  };
});

// ── Test date constants ───────────────────────────────────────────────────────
// All pinned to the NEXT calendar month, day 5 / 8 / 12.
// The calendar starts at the current month, so a single "Next ›" click
// brings us to the month where all test tiles live.

const _today = new Date();
const _nmYear = _today.getMonth() === 11 ? _today.getFullYear() + 1 : _today.getFullYear();
const _nmMonth = (_today.getMonth() + 1) % 12; // 0-based
const _mm = String(_nmMonth + 1).padStart(2, '0');

const BORROW_DATE   = `${_nmYear}-${_mm}-05`;   // next-month 5th (borrow)
const CONFLICT_DATE = `${_nmYear}-${_mm}-08`;   // next-month 8th (fully booked in S9)
const RETURN_DATE   = `${_nmYear}-${_mm}-12`;   // next-month 12th (return)

const borrowTileLabel = `${BORROW_DATE} — available`;
const returnTileLabel  = `${RETURN_DATE} — available`;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_EQUIPMENT = {
  id: 'equip-001',
  name: 'Test Projector',
  quantity: 3,
  max_quantity: 5,
  is_available: true,
};

function makeAvail(overrides: Partial<AvailabilityEntry> = {}): AvailabilityEntry {
  return {
    borrow_date: BORROW_DATE,
    return_date: BORROW_DATE,
    status: 'approved',
    quantity_requested: 5,
    ...overrides,
  };
}

// Conflict availability: CONFLICT_DATE is fully booked (5 / max 5)
const CONFLICT_AVAIL: AvailabilityEntry[] = [
  makeAvail({ borrow_date: CONFLICT_DATE, return_date: CONFLICT_DATE, quantity_requested: 5 }),
];

// ── Mock helpers ──────────────────────────────────────────────────────────────

function setupAxiosMock(avail: AvailabilityEntry[] = []) {
  const mockGet = vi.mocked(axios.get);
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/inventory/'))    return Promise.resolve({ data: MOCK_EQUIPMENT });
    if (url.includes('/availability/')) return Promise.resolve({ data: avail });
    return Promise.resolve({ data: {} });
  });
}

// ── Core setup helper ─────────────────────────────────────────────────────────
/**
 * Renders BorrowReservation, waits for data to load, then navigates the
 * calendar to next month (where all test dates live).
 * Returns a userEvent instance ready to use.
 */
async function setup(avail: AvailabilityEntry[] = []) {
  setupAxiosMock(avail);
  const user = userEvent.setup();
  render(<BorrowReservation />);
  await waitFor(() => expect(screen.getByText('Test Projector')).toBeInTheDocument(),
    { timeout: 5000 });
  // Navigate to the month where our test dates live
  await user.click(screen.getByRole('button', { name: /next month/i }));
  return user;
}

// ── Interaction helpers ───────────────────────────────────────────────────────

async function clickBorrowDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: (n) => n.includes(borrowTileLabel) }),
  );
}

async function clickReturnDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: (n) => n.includes(returnTileLabel) }),
  );
}

/** Click a time slot card by the visible label text (e.g. "Morning", "Evening"). */
async function selectSlot(user: ReturnType<typeof userEvent.setup>, label: string) {
  // Scope the query to the time slot panel so we never accidentally hit other buttons.
  const heading = screen.getByRole('heading', { name: /Step 2/i });
  const panel = heading.parentElement!;
  const btn = Array.from(panel.querySelectorAll('button')).find(
    (b) => b.textContent?.toLowerCase().includes(label.toLowerCase()),
  );
  if (!btn) throw new Error(`Slot card "${label}" not found inside time-slot panel`);
  await user.click(btn as HTMLButtonElement);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// S1 — Initial render
// ═══════════════════════════════════════════════════════════════════════════════

describe('S1 — Initial render', () => {
  it('shows loading text on mount before data arrives', () => {
    setupAxiosMock();
    render(<BorrowReservation />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders equipment name after data loads', async () => {
    setupAxiosMock();
    render(<BorrowReservation />);
    await waitFor(() => expect(screen.getByText('Test Projector')).toBeInTheDocument());
  });

  it('does NOT show the time slot panel (Step 2) after data loads', async () => {
    setupAxiosMock();
    render(<BorrowReservation />);
    await waitFor(() => expect(screen.getByText('Test Projector')).toBeInTheDocument());
    expect(screen.queryByText(/Step 2/i)).not.toBeInTheDocument();
  });

  it('does NOT show the form (Step 3) after data loads', async () => {
    setupAxiosMock();
    render(<BorrowReservation />);
    await waitFor(() => expect(screen.getByText('Test Projector')).toBeInTheDocument());
    expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S2 — Click borrow date
// ═══════════════════════════════════════════════════════════════════════════════

describe('S2 — Click borrow date', () => {
  it('time slot panel (Step 2) appears after clicking an available date', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
  });

  it('confirm bar appears with "Borrow:" after clicking a date', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    expect(screen.getByText(/Borrow:/i)).toBeInTheDocument();
  });

  it('form (Step 3) is still hidden after only borrow date is chosen', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S3 — Same-day return (AM)
// ═══════════════════════════════════════════════════════════════════════════════

describe('S3 — Same-day return (AM)', () => {
  it('clicking the borrow date tile again after selecting AM reveals the form (Step 3)', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    // Same tile click → same-day rangeEnd → form should appear
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
  });

  it('AM same-day: confirm bar shows both Borrow and Return labels', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickBorrowDate(user);
    await waitFor(() => {
      expect(screen.getByText(/Borrow:/i)).toBeInTheDocument();
      expect(screen.getByText(/Return:/i)).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S4 — Same-day return (PM)
// ═══════════════════════════════════════════════════════════════════════════════

describe('S4 — Same-day return (PM)', () => {
  it('clicking the borrow date tile again after selecting PM reveals the form', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Afternoon');
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S5 — No same-day return (Evening)
// ═══════════════════════════════════════════════════════════════════════════════

describe('S5 — No same-day return (Evening)', () => {
  it('clicking the borrow date tile again after Evening CLEARS the selection', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Evening');
    // Same tile → clears (Evening doesn't allow same-day)
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.queryByText(/Step 2/i)).not.toBeInTheDocument());
  });

  it('Evening: form (Step 3) does NOT appear after attempted same-day click', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Evening');
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S6 — No same-day return (Whole Day)
// ═══════════════════════════════════════════════════════════════════════════════

describe('S6 — No same-day return (Whole Day)', () => {
  it('clicking the borrow date tile again after Whole Day CLEARS the selection', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Whole Day');
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.queryByText(/Step 2/i)).not.toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S7 — Slot change invalidation
// ═══════════════════════════════════════════════════════════════════════════════

describe('S7 — Slot change invalidation', () => {
  it('switching AM → Evening after same-day range clears rangeEnd (form disappears)', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickBorrowDate(user); // same-day range → form visible
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    await selectSlot(user, 'Evening'); // rangeEnd invalidated
    await waitFor(() => expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument());
  });

  it('switching PM → Whole Day after same-day range clears rangeEnd', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Afternoon');
    await clickBorrowDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    await selectSlot(user, 'Whole Day');
    await waitFor(() => expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S8 — Multi-day range
// ═══════════════════════════════════════════════════════════════════════════════

describe('S8 — Multi-day range', () => {
  it('form (Step 3) appears after borrow date + AM slot + a later return date', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
  });

  it('confirm bar shows both Borrow and Return labels for a multi-day range', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() => {
      expect(screen.getByText(/Borrow:/i)).toBeInTheDocument();
      expect(screen.getByText(/Return:/i)).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S9 — Range conflict
// ═══════════════════════════════════════════════════════════════════════════════

describe('S9 — Range conflict', () => {
  // CONFLICT_DATE (8th) is fully booked; it falls between borrow (5th) and return (12th)

  it('shows range warning when a fully booked date falls inside the selected range', async () => {
    const user = await setup(CONFLICT_AVAIL);
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() =>
      expect(screen.getByText(/Some dates in this range are fully booked/i)).toBeInTheDocument(),
    );
  });

  it('submit shows conflict error; axios.post is never called', async () => {
    const user = await setup(CONFLICT_AVAIL);
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    // Enable submit by checking privacy consent
    await user.click(screen.getByRole('checkbox', { name: /voluntarily authorize/i }));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/fully booked dates/i)).toBeInTheDocument(),
    );
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S10 — Clear button
// ═══════════════════════════════════════════════════════════════════════════════

describe('S10 — Clear button (×)', () => {
  it('clicking × removes the time slot panel', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    await waitFor(() => expect(screen.queryByText(/Step 2/i)).not.toBeInTheDocument());
  });

  it('clicking × also removes the form when it was visible', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickBorrowDate(user); // same-day range
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /clear selection/i }));
    await waitFor(() => expect(screen.queryByText(/Step 3/i)).not.toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S11 — Calendar hint text
// ═══════════════════════════════════════════════════════════════════════════════

describe('S11 — Calendar hint text', () => {
  it('shows "Select a time slot" hint when borrow date is set but no slot chosen', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    expect(screen.getByText(/select a time slot/i)).toBeInTheDocument();
  });

  it('shows "same date or a later date" hint after AM is selected', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    expect(screen.getByText(/same date or a later date/i)).toBeInTheDocument();
  });

  it('shows "same date or a later date" hint after PM is selected', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Afternoon');
    expect(screen.getByText(/same date or a later date/i)).toBeInTheDocument();
  });

  it('shows "a later date" hint after Evening is selected', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Evening');
    expect(screen.getByText(/click a later date/i)).toBeInTheDocument();
  });

  it('shows "a later date" hint after Whole Day is selected', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Whole Day');
    expect(screen.getByText(/click a later date/i)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S12 — Slot card notes
// ═══════════════════════════════════════════════════════════════════════════════

describe('S12 — Slot card notes', () => {
  it('shows exactly 2 "Same-day return allowed" notes (AM + PM cards)', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    const notes = screen.getAllByText(/same-day return allowed/i);
    expect(notes).toHaveLength(2);
  });

  it('shows exactly 2 "Return date must be a later day" notes (Evening + Whole Day)', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    const notes = screen.getAllByText(/return date must be a later day/i);
    expect(notes).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S13 — Form validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('S13 — Form validation', () => {
  it('submit button is disabled when privacy consent is not checked', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /submit reservation/i })).toBeDisabled();
  });

  it('shows required-fields error when name and student number are missing', async () => {
    const user = await setup();
    await clickBorrowDate(user);
    await selectSlot(user, 'Morning');
    await clickReturnDate(user);
    await waitFor(() => expect(screen.getByText(/Step 3/i)).toBeInTheDocument());
    await user.click(screen.getByRole('checkbox', { name: /voluntarily authorize/i }));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/fill in all required fields/i)).toBeInTheDocument(),
    );
  });
});
