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
    const { data, error } = await anonSupabase
      .from("committees")
      .select("*")
      .eq("is_archived", false)
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

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { error } = await userSupabase
      .from("committees")
      .insert({ name: name.trim() });
    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id, name } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { error } = await userSupabase
      .from("committees")
      .update({ name: name.trim() })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");

    // Guard: refuse if any officer is assigned to this committee
    const { count, error: memberError } = await supabase
      .from("officers")
      .select("*", { count: "exact", head: true })
      .eq("committee", id);

    if (memberError) throw new Error(memberError.message);
    if (count > 0) {
      throw new ApiError(400, "Cannot delete a committee that has members.");
    }

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { error } = await userSupabase
      .from("committees")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);

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

    // Guard: reject if any non-archived officer is still assigned to one of these committees
    for (const id of ids) {
      const { count, error: memberError } = await supabase
        .from("officers")
        .select("*", { count: "exact", head: true })
        .eq("committee", id)
        .eq("is_archived", false);
      if (memberError) throw new Error(memberError.message);
      if (count > 0) {
        throw new ApiError(
          400,
          "This committee still has active members. Archive or reassign them first.",
        );
      }
    }

    const token = req.token;
    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("committees")
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new Error(error.message);
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
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("committees")
      .update({ is_archived: false, archived_at: null })
      .in("id", ids);
    if (error) throw new Error(error.message);
    return res.sendStatus(200);
  }),
);

export default router;
