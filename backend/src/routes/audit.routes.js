import { Router } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { createUserClient } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// GET all audit logs
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Fetch audit logs with optional count query parameter
    if (req.query?.count) {
      const { data, error } = await userSupabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(req.query.count);
      if (error) throw new ApiError(error.message);
      return res.status(200).json(data);
    }

    // Fetch audit logs from the database
    const { data, error } = await userSupabase.from("audit_logs").select("*");
    if (error) throw new ApiError(error.message);

    return res.status(200).json(data);
  }),
);

export default router;
