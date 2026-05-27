import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeDateStatus,
  sameDayReturnAllowed,
  timeSlotLabel,
  timeSlotShort,
  TIME_SLOTS,
  type AvailabilityEntry,
} from '../../src/route/borrow/BorrowReservation';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = '2026-05-27';
const YESTERDAY = '2026-05-26';
const TOMORROW = '2026-05-28';
const MAX_QTY = 5;

function makeEntry(
  borrow_date: string,
  return_date: string,
  quantity_requested: number,
): AvailabilityEntry {
  return { borrow_date, return_date, status: 'approved', quantity_requested };
}

// ── computeDateStatus ─────────────────────────────────────────────────────────

describe('computeDateStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T10:00:00`));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "past" for a date strictly before today', () => {
    expect(computeDateStatus(YESTERDAY, [], MAX_QTY)).toBe('past');
  });

  it('returns "available" for today when no reservations exist', () => {
    expect(computeDateStatus(TODAY, [], MAX_QTY)).toBe('available');
  });

  it('returns "available" for a future date with no reservations', () => {
    expect(computeDateStatus(TOMORROW, [], MAX_QTY)).toBe('available');
  });

  it('returns "available" when a reservation exists but does NOT overlap the target date', () => {
    const avail: AvailabilityEntry[] = [makeEntry('2026-06-01', '2026-06-03', 3)];
    expect(computeDateStatus(TOMORROW, avail, MAX_QTY)).toBe('available');
  });

  it('returns "partial" when reserved quantity < maxQty for the target date', () => {
    const avail: AvailabilityEntry[] = [makeEntry(TODAY, TOMORROW, 3)]; // 3 < 5
    expect(computeDateStatus(TODAY, avail, MAX_QTY)).toBe('partial');
  });

  it('returns "full" when reserved quantity equals maxQty', () => {
    const avail: AvailabilityEntry[] = [makeEntry(TODAY, TOMORROW, 5)]; // 5 === 5
    expect(computeDateStatus(TODAY, avail, MAX_QTY)).toBe('full');
  });

  it('returns "full" when multiple reservations together reach maxQty', () => {
    const avail: AvailabilityEntry[] = [
      makeEntry(TODAY, TOMORROW, 3),
      makeEntry(TODAY, TOMORROW, 2),
    ]; // 3 + 2 = 5
    expect(computeDateStatus(TODAY, avail, MAX_QTY)).toBe('full');
  });

  it('returns "full" when reserved quantity exceeds maxQty', () => {
    const avail: AvailabilityEntry[] = [makeEntry(TODAY, TOMORROW, 7)]; // 7 > 5
    expect(computeDateStatus(TODAY, avail, MAX_QTY)).toBe('full');
  });

  it('counts a reservation that spans across the target date', () => {
    // Reservation from yesterday to tomorrow spans today
    const avail: AvailabilityEntry[] = [makeEntry(YESTERDAY, TOMORROW, 5)];
    expect(computeDateStatus(TODAY, avail, MAX_QTY)).toBe('full');
  });
});

// ── sameDayReturnAllowed ──────────────────────────────────────────────────────

describe('sameDayReturnAllowed', () => {
  it('returns true for "AM"', () => {
    expect(sameDayReturnAllowed('AM')).toBe(true);
  });

  it('returns true for "PM"', () => {
    expect(sameDayReturnAllowed('PM')).toBe(true);
  });

  it('returns false for "evening"', () => {
    expect(sameDayReturnAllowed('evening')).toBe(false);
  });

  it('returns false for "whole-day"', () => {
    expect(sameDayReturnAllowed('whole-day')).toBe(false);
  });

  it('returns false for null', () => {
    expect(sameDayReturnAllowed(null)).toBe(false);
  });
});

// ── timeSlotLabel ─────────────────────────────────────────────────────────────

describe('timeSlotLabel', () => {
  it('AM → "AM (8:00 AM – 12:00 PM)"', () => {
    expect(timeSlotLabel('AM')).toBe('AM (8:00 AM – 12:00 PM)');
  });

  it('PM → "PM (1:00 PM – 5:00 PM)"', () => {
    expect(timeSlotLabel('PM')).toBe('PM (1:00 PM – 5:00 PM)');
  });

  it('evening → "Evening (5:00 PM – 9:00 PM)"', () => {
    expect(timeSlotLabel('evening')).toBe('Evening (5:00 PM – 9:00 PM)');
  });

  it('whole-day → "Whole Day (8:00 AM – 5:00 PM)"', () => {
    expect(timeSlotLabel('whole-day')).toBe('Whole Day (8:00 AM – 5:00 PM)');
  });
});

// ── timeSlotShort ─────────────────────────────────────────────────────────────

describe('timeSlotShort', () => {
  it('AM → "Morning (AM)"', () => {
    expect(timeSlotShort('AM')).toBe('Morning (AM)');
  });

  it('PM → "Afternoon (PM)"', () => {
    expect(timeSlotShort('PM')).toBe('Afternoon (PM)');
  });

  it('evening → "Evening"', () => {
    expect(timeSlotShort('evening')).toBe('Evening');
  });

  it('whole-day → "Whole Day"', () => {
    expect(timeSlotShort('whole-day')).toBe('Whole Day');
  });
});

// ── TIME_SLOTS constant ───────────────────────────────────────────────────────

describe('TIME_SLOTS', () => {
  it('contains exactly 4 entries', () => {
    expect(TIME_SLOTS).toHaveLength(4);
  });

  it('entries are in order: AM, PM, evening, whole-day', () => {
    expect(TIME_SLOTS.map((s) => s.id)).toEqual(['AM', 'PM', 'evening', 'whole-day']);
  });

  it('AM has sameDayReturn: true', () => {
    expect(TIME_SLOTS.find((s) => s.id === 'AM')?.sameDayReturn).toBe(true);
  });

  it('PM has sameDayReturn: true', () => {
    expect(TIME_SLOTS.find((s) => s.id === 'PM')?.sameDayReturn).toBe(true);
  });

  it('evening has sameDayReturn: false', () => {
    expect(TIME_SLOTS.find((s) => s.id === 'evening')?.sameDayReturn).toBe(false);
  });

  it('whole-day has sameDayReturn: false', () => {
    expect(TIME_SLOTS.find((s) => s.id === 'whole-day')?.sameDayReturn).toBe(false);
  });

  it('each slot has a non-empty label, sub, and note', () => {
    for (const slot of TIME_SLOTS) {
      expect(slot.label.length).toBeGreaterThan(0);
      expect(slot.sub.length).toBeGreaterThan(0);
      expect(slot.note.length).toBeGreaterThan(0);
    }
  });
});
