// MANUAL STEP: ALTER TABLE committees ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
// MANUAL STEP: ALTER TABLE committees ADD COLUMN IF NOT EXISTS archived_at timestamptz;

import { Router } from "express";
import { anonSupabase, supabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";

const router = Router();

// ── Read ──────────────────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status ?? "active";
    const { data, error } = await anonSupabase
      .from("committees")
      .select("*")
      .eq("status", status)
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);
    return res.status(200).json(data);
  }),
);

// ── Write ─────────────────────────────────────────────────────────────────────

router.post(
  "/add",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const { data, error } = await supabase
      .from("committees")
      .insert({ name: name.trim(), status: "active" })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);

    return res.status(200).json(data);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id, name } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");
    const intId = parseInt(id, 10);
    if (isNaN(intId)) throw new ApiError(400, "Invalid committee ID");

    const { error } = await supabase
      .from("committees")
      .update({ name: name.trim() })
      .eq("id", intId);
    if (error) throw new ApiError(500, "Update failed: " + error.message);

    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "ids must be a non-empty array");
    const intIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (intIds.length === 0) throw new ApiError(400, "Invalid committee IDs");
    const { error } = await supabase.from("committees").delete().in("id", intIds);
    if (error) throw new ApiError(500, "Delete failed: " + error.message);
    return res.sendStatus(200);
  }),
);

// ── Archive / Restore ─────────────────────────────────────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase
      .from("committees")
      .select("*")
      .eq("is_archived", true)
      .order("archived_at", { ascending: false });
    if (error) throw new Error(error.message);
    return res.status(200).json(data);
  }),
);

router.post(
  "/archive",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const intIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (intIds.length === 0) throw new ApiError(400, "Invalid committee IDs");

    const { error } = await supabase
      .from("committees")
      .update({ status: "archived" })
      .in("id", intIds);
    if (error) throw new ApiError(500, "Archive failed: " + error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const intIds = ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (intIds.length === 0) throw new ApiError(400, "Invalid committee IDs");
    const { error } = await supabase
      .from("committees")
      .update({ status: "active" })
      .in("id", intIds);
    if (error) throw new ApiError(500, "Restore failed: " + error.message);
    return res.sendStatus(200);
  }),
);

export default router;
