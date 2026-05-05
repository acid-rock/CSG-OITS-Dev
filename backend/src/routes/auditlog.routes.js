import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";

const router = Router();

// Supports optional ?limit=N query parameter for dashboard recent-activity widget.
// Without limit, returns all rows (used by the full audit log panel).
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const limitRaw = parseInt(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null;

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    // Enrich each log entry with admin email from auth users
    const uniqueAdminIds = [...new Set(data.map((r) => r.created_by).filter(Boolean))];
    let emailMap = {};
    if (uniqueAdminIds.length > 0) {
      try {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        emailMap = Object.fromEntries(users.map((u) => [u.id, u.email ?? u.id]));
      } catch {
        // Non-fatal — fall back to UUID display
      }
    }

    const enriched = data.map((row) => ({
      ...row,
      admin_name: emailMap[row.created_by] ?? row.created_by ?? "—",
    }));

    return res.status(200).json(enriched);
  }),
);

export default router;
