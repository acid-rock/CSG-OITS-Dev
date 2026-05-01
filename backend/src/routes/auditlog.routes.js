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

    return res.status(200).json(data);
  }),
);

export default router;
