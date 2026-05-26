import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, setCache, invalidateCache, invalidateCachePrefix }
  from '../../src/lib/cache.js';

describe('in-memory cache', () => {
  beforeEach(() => {
    // Empty-string prefix matches every key — clears the entire store
    invalidateCachePrefix('');
  });

  it('returns null for a key that has never been set', () => {
    expect(getCached('nonexistent')).toBeNull();
  });

  it('returns stored value immediately after set', () => {
    setCache('test:key', { foo: 'bar' }, 60_000);
    expect(getCached('test:key')).toEqual({ foo: 'bar' });
  });

  it('returns null after TTL has expired', () => {
    vi.useFakeTimers();
    setCache('test:ttl', 'value', 100); // 100 ms TTL
    vi.advanceTimersByTime(101);
    expect(getCached('test:ttl')).toBeNull();
    vi.useRealTimers();
  });

  it('invalidateCache removes a specific key', () => {
    setCache('test:remove', 'value', 60_000);
    invalidateCache('test:remove');
    expect(getCached('test:remove')).toBeNull();
  });

  it('invalidateCachePrefix removes all matching keys', () => {
    setCache('officers:active', [1, 2, 3], 60_000);
    setCache('officers:archived', [4, 5], 60_000);
    setCache('committees:active', ['a'], 60_000);
    invalidateCachePrefix('officers:');
    expect(getCached('officers:active')).toBeNull();
    expect(getCached('officers:archived')).toBeNull();
    expect(getCached('committees:active')).toEqual(['a']); // untouched
  });

  it('setCache overwrites an existing key', () => {
    setCache('test:overwrite', 'first', 60_000);
    setCache('test:overwrite', 'second', 60_000);
    expect(getCached('test:overwrite')).toBe('second');
  });
});
