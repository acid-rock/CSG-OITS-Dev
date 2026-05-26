import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";

const router = Router();

// Supports optional ?limit=N query parameter for dashboard recent-activity widget.
// Without limit, paginates through ALL rows in chunks of 500 to bypass the
// Supabase-JS default cap of 1 000 rows per request.
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const limitRaw = parseInt(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null;

    let rows = [];

    if (limit) {
      // Dashboard widget: single bounded fetch — no need to loop.
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new ApiError(500, error.message);
      rows = data;
    } else {
      // Full audit log panel: loop in 500-row pages until exhausted.
      // supabase-js silently caps at 1 000 rows without an explicit range,
      // so we use .range(from, to) to page through the entire table.
      const PAGE_SIZE = 500;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw new ApiError(500, error.message);
        rows = rows.concat(data);
        // If fewer rows than PAGE_SIZE came back, we've reached the end.
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
    }

    // Enrich each log entry with admin email from auth users
    const uniqueAdminIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))];
    let emailMap = {};
    if (uniqueAdminIds.length > 0) {
      try {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        emailMap = Object.fromEntries(users.map((u) => [u.id, u.email ?? u.id]));
      } catch {
        // Non-fatal — fall back to UUID display
      }
    }

    const enriched = rows.map((row) => ({
      ...row,
      admin_name: emailMap[row.created_by] ?? row.created_by ?? "—",
    }));

    return res.status(200).json(enriched);
  }),
);

export default router;
