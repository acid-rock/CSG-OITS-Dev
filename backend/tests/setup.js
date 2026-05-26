import { vi, beforeEach, afterEach } from 'vitest';

// Suppress console.log noise during tests (allow warn/error)
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
