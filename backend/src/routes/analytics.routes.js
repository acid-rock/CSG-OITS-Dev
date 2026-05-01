import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";

const router = Router();

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 56);

    // -- Aggregate counts --
    const [officersRes, documentsRes, docsWeekRes, bulletinRes, eventsRes] =
      await Promise.all([
        supabase.from("officers").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("bulletin").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
      ]);

    for (const r of [officersRes, documentsRes, docsWeekRes, bulletinRes, eventsRes]) {
      if (r.error) throw new ApiError(500, r.error.message);
    }

    // -- Monthly upload data (last 6 months) --
    const [docsMonthly, bulletinMonthly] = await Promise.all([
      supabase
        .from("documents")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString()),
      supabase
        .from("bulletin")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString()),
    ]);

    if (docsMonthly.error) throw new ApiError(500, docsMonthly.error.message);
    if (bulletinMonthly.error) throw new ApiError(500, bulletinMonthly.error.message);

    const uploads_by_month = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now);
      ref.setDate(1);
      ref.setMonth(now.getMonth() - i);
      const m = ref.getMonth();
      const y = ref.getFullYear();
      const inMonth = (r) => {
        const c = new Date(r.created_at);
        return c.getMonth() === m && c.getFullYear() === y;
      };
      uploads_by_month.push({
        month: MONTHS[m],
        documents: docsMonthly.data.filter(inMonth).length,
        announcements: bulletinMonthly.data.filter(inMonth).length,
      });
    }

    // -- Weekly activity (last 8 weeks — uploads used as engagement proxy) --
    // MANUAL STEP: Once a views column is added via increment_views() RPC, replace
    // the upload-count proxy below with a real views query.
    const [docsWeekly, bulletinWeekly] = await Promise.all([
      supabase
        .from("documents")
        .select("created_at")
        .gte("created_at", eightWeeksAgo.toISOString()),
      supabase
        .from("bulletin")
        .select("created_at")
        .gte("created_at", eightWeeksAgo.toISOString()),
    ]);

    if (docsWeekly.error) throw new ApiError(500, docsWeekly.error.message);
    if (bulletinWeekly.error) throw new ApiError(500, bulletinWeekly.error.message);

    const allUploads = [
      ...(docsWeekly.data ?? []),
      ...(bulletinWeekly.data ?? []),
    ];

    const views_by_week = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const count = allUploads.filter((r) => {
        const c = new Date(r.created_at);
        return c >= weekStart && c <= weekEnd;
      }).length;

      views_by_week.push({ week: `Week ${8 - i}`, views: count });
    }

    return res.status(200).json({
      total_officers: officersRes.count ?? 0,
      total_documents: documentsRes.count ?? 0,
      documents_this_week: docsWeekRes.count ?? 0,
      total_announcements: bulletinRes.count ?? 0,
      total_events: eventsRes.count ?? 0,
      uploads_by_month,
      views_by_week,
    });
  }),
);

export default router;
