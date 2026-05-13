import { Router } from "express";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { supabase, anonSupabase } from "../lib/supabaseClient.js";
import ApiError from "../lib/apiError.js";
import { getCached, setCache } from "../lib/cache.js";

const router = Router();

const BUCKETS = ["bulletin", "documents", "thumbnails", "events", "officers"];

// Lists all files in a bucket up to two directory levels deep and sums their sizes.
const getBucketSize = async (bucket) => {
  try {
    const { data: topLevel } = await supabase.storage.from(bucket).list("", { limit: 1000 });
    if (!topLevel) return 0;

    let total = 0;
    for (const item of topLevel) {
      if (item.metadata) {
        total += item.metadata.size ?? 0;
      } else {
        // Virtual folder — list one level deeper
        const { data: sub } = await supabase.storage.from(bucket).list(item.name, { limit: 1000 });
        if (sub) {
          total += sub.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
};

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const cacheKey = "dashboard:summary";
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const safe = (r) => (r.error ? 0 : (r.count ?? r.data?.length ?? 0));
    const safeData = (r) => (r.error ? null : r.data);

    const [
      officersRes,
      officersArchivedRes,
      committeesRes,
      committeesArchivedRes,
      documentsRes,
      documentsArchivedRes,
      announcementsRes,
      announcementsArchivedRes,
      eventsRes,
      eventsArchivedRes,
      equipmentRes,
      pinnedRes,
    ] = await Promise.all([
      anonSupabase.from("officers").select("*", { count: "exact", head: true }).eq("status", "active"),
      anonSupabase.from("officers").select("*", { count: "exact", head: true }).eq("status", "archived"),
      anonSupabase.from("committees").select("*", { count: "exact", head: true }).eq("status", "active"),
      anonSupabase.from("committees").select("*", { count: "exact", head: true }).eq("status", "archived"),
      anonSupabase.from("documents").select("*", { count: "exact", head: true }).eq("is_archived", false).is("deleted_at", null),
      anonSupabase.from("documents").select("*", { count: "exact", head: true }).eq("is_archived", true),
      anonSupabase.from("bulletin").select("*", { count: "exact", head: true }).eq("is_archived", false).is("deleted_at", null),
      anonSupabase.from("bulletin").select("*", { count: "exact", head: true }).eq("is_archived", true),
      anonSupabase.from("events").select("*", { count: "exact", head: true }).eq("is_archived", false).is("deleted_at", null),
      anonSupabase.from("events").select("*", { count: "exact", head: true }).eq("is_archived", true),
      anonSupabase.from("equipment").select("id, is_available"),
      anonSupabase.from("bulletin").select("id, title, created_at").eq("is_pinned", true).limit(1).single(),
    ]);

    const equipment = safeData(equipmentRes) ?? [];

    const summary = {
      officers: {
        total: safe(officersRes) + safe(officersArchivedRes),
        active: safe(officersRes),
        archived: safe(officersArchivedRes),
      },
      committees: {
        total: safe(committeesRes) + safe(committeesArchivedRes),
        active: safe(committeesRes),
        archived: safe(committeesArchivedRes),
      },
      documents: {
        total: safe(documentsRes) + safe(documentsArchivedRes),
        active: safe(documentsRes),
        archived: safe(documentsArchivedRes),
      },
      announcements: {
        total: safe(announcementsRes) + safe(announcementsArchivedRes),
        active: safe(announcementsRes),
        archived: safe(announcementsArchivedRes),
      },
      events: {
        total: safe(eventsRes) + safe(eventsArchivedRes),
        active: safe(eventsRes),
        archived: safe(eventsArchivedRes),
      },
      equipment: {
        total: equipment.length,
        available: equipment.filter((e) => e.is_available).length,
      },
      pinnedAnnouncement: pinnedRes.error ? null : pinnedRes.data,
    };

    setCache(cacheKey, summary, 60_000);
    return res.json(summary);
  }),
);

router.get(
  "/storage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cacheKey = "dashboard:storage";
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    const stats = await Promise.all(
      BUCKETS.map(async (bucket) => ({
        name: bucket,
        size: await getBucketSize(bucket),
      })),
    );
    setCache(cacheKey, stats, 300_000);
    return res.status(200).json(stats);
  }),
);

export default router;
