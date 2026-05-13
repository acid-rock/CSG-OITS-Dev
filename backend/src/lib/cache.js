const store = new Map();

/**
 * Get a cached value. Returns null if missing or expired.
 * @param {string} key
 * @returns {any|null}
 */
export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a value in cache with a TTL.
 * @param {string} key
 * @param {any} data
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function setCache(key, data, ttlMs = 60_000) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Manually invalidate a cache key (call this after any write operation
 * that modifies the cached resource).
 * @param {string} key
 */
export function invalidateCache(key) {
  store.delete(key);
}

/**
 * Invalidate all keys that start with a given prefix.
 * Useful for invalidating a resource family (e.g., 'officers:').
 * @param {string} prefix
 */
export function invalidateCachePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
