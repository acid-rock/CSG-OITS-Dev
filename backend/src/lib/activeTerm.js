import { supabase } from "./supabaseClient.js";
import { getCached, setCache, invalidateCache } from "./cache.js";

const CACHE_KEY = "settings:active_term";
// Fallback mirrors settings.routes.js GET /term so behaviour is unchanged when
// the active_term row hasn't been seeded yet.
const FALLBACK = "2025-2026";

/**
 * Read the current active term label (the value of settings.active_term),
 * cached for 60s. Used by content /add routes to stamp term_year.
 * Always returns a non-empty string.
 * @returns {Promise<string>}
 */
export async function getActiveTerm() {
  const cached = getCached(CACHE_KEY);
  if (cached !== null) return cached;

  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "active_term")
    .maybeSingle();

  const value = data?.value ?? FALLBACK;
  setCache(CACHE_KEY, value, 60_000);
  return value;
}

/** Drop the cached active term. Call right after activating a new term. */
export function invalidateActiveTerm() {
  invalidateCache(CACHE_KEY);
}
