import { Router } from "express";
import { anonSupabase, supabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import { getCached, setCache } from "../lib/cache.js";

const router = Router();

const VALID_TYPES = ["document", "announcement", "event"];

// ── Public: record a view ─────────────────────────────────────────────────────
// POST /api/v1/views/track
// Body: { entity_type: "document"|"announcement"|"event", entity_id?: uuid }
// Fire-and-forget from public pages; always returns 200 so client never errors.

router.post(
  "/track",
  asyncHandler(async (req, res) => {
    const { entity_type, entity_id } = req.body ?? {};

    if (!entity_type || !VALID_TYPES.includes(entity_type)) {
      // Silently reject bad payloads — don't error the public page
      return res.json({ ok: false, reason: "invalid entity_type" });
    }

    // Use anonSupabase — RLS allows anon INSERT on page_views
    await anonSupabase.from("page_views").insert({
      entity_type,
      entity_id: entity_id ?? null,
      ip_address: req.ip ?? null,
    });
    // Intentionally ignoring error — if the table doesn't exist yet (migration
    // not run), the endpoint degrades silently rather than breaking public pages.

    return res.json({ ok: true });
  }),
);

// ── Admin: daily view stats ───────────────────────────────────────────────────
// GET /api/v1/views/stats?days=7|30
// Returns: { dates: string[], document: number[], announcement: number[], event: number[] }

router.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const daysRaw = parseInt(req.query.days);
    const days    = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 90) : 30;

    const cacheKey = `views:stats:${days}`;
    const cached   = getCached(cacheKey);
    if (cached) return res.json(cached);

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("page_views")
      .select("entity_type, viewed_at")
      .gte("viewed_at", since.toISOString())
      .order("viewed_at", { ascending: true });

    if (error) throw new ApiError(500, error.message);

    // Build date buckets: YYYY-MM-DD strings for the requested window
    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateRange.push(d.toISOString().slice(0, 10));
    }

    const buckets = {
      document:     Object.fromEntries(dateRange.map((d) => [d, 0])),
      announcement: Object.fromEntries(dateRange.map((d) => [d, 0])),
      event:        Object.fromEntries(dateRange.map((d) => [d, 0])),
    };

    for (const row of data ?? []) {
      const date = row.viewed_at.slice(0, 10);
      if (buckets[row.entity_type]?.[date] !== undefined) {
        buckets[row.entity_type][date]++;
      }
    }

    const result = {
      dates:        dateRange,
      document:     dateRange.map((d) => buckets.document[d]),
      announcement: dateRange.map((d) => buckets.announcement[d]),
      event:        dateRange.map((d) => buckets.event[d]),
    };

    // Cache for 60 s — views chart doesn't need real-time accuracy
    setCache(cacheKey, result, 60_000);
    return res.json(result);
  }),
);

export default router;
