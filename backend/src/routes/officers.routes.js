// MANUAL STEP: ALTER TABLE officers ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
// MANUAL STEP: ALTER TABLE officers ADD COLUMN IF NOT EXISTS archived_at timestamptz;

import { Router } from "express";
import { anonSupabase, supabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const transformOfficer = (officer) => {
  if (officer.avatar === null) return officer;
  const avatar = anonSupabase.storage
    .from("officers")
    .getPublicUrl(officer.avatar).data.publicUrl;
  return {
    id: officer.id,
    created_at: officer.created_at,
    full_name: officer.full_name,
    position: officer.position,
    avatar: avatar,
    type: officer.type,
    socials: officer.socials,
    year_serving: officer.year_serving,
    student_number: officer.student_number,
    committee: officer.committee,
    is_committee_official: officer.is_committee_official,
  };
};

// ── Read ──────────────────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageStr = req.query.page;
    const limitStr = req.query.limit;

    if (pageStr !== undefined || limitStr !== undefined) {
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const statusFilter = req.query.status || "active";

      const { data, error, count } = await anonSupabase
        .from("officers")
        .select("*", { count: "exact" })
        .eq("status", statusFilter)
        .order("created_at", { ascending: true })
        .range(from, to);
      if (error) throw new Error(error.message);

      return res.status(200).json({
        data: data.map(transformOfficer),
        total: count,
        page,
        limit,
      });
    }

    const statusFilter = req.query.status || "active";

    const { data, error } = await anonSupabase
      .from("officers")
      .select()
      .eq("status", statusFilter)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return res.status(200).json(data.map(transformOfficer));
  }),
);

// ── Write ─────────────────────────────────────────────────────────────────────

router.post(
  "/add",
  requireAuth,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const {
      full_name, position, type, socials,
      year_serving, student_number, committee, is_committee_official,
    } = req.body;

    if (!full_name) throw new ApiError(400, "full_name is required.");
    if (!position) throw new ApiError(400, "position is required.");
    if (!type) throw new ApiError(400, "type is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { data: inserted, error: insertError } = await userSupabase
      .from("officers")
      .insert({
        full_name,
        position,
        type,
        socials: socials || null,
        year_serving: year_serving || null,
        student_number: student_number || null,
        committee: committee || null,
        is_committee_official:
          is_committee_official === "true" || is_committee_official === true,
        avatar: null,
      })
      .select();

    if (insertError) throw new Error(insertError.message);

    const officerId = inserted[0].id;

    if (req.file) {
      const ext = req.file.mimetype.split("/")[1] || "jpg";
      const avatarPath = `${officerId}.${ext}`;

      const { error: uploadError } = await userSupabase.storage
        .from("officers")
        .upload(avatarPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { error: updateError } = await userSupabase
        .from("officers")
        .update({ avatar: avatarPath })
        .eq("id", officerId);
      if (updateError) throw new Error(updateError.message);
    }

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const {
      id, full_name, position, type, socials,
      year_serving, student_number, committee, is_committee_official,
    } = req.body;

    if (!id) throw new ApiError(400, "id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (position !== undefined) updates.position = position;
    if (type !== undefined) updates.type = type;
    if (socials !== undefined) updates.socials = socials || null;
    if (year_serving !== undefined) updates.year_serving = year_serving || null;
    if (student_number !== undefined) updates.student_number = student_number || null;
    if (committee !== undefined) updates.committee = committee ? parseInt(committee) : null;
    if (is_committee_official !== undefined) {
      updates.is_committee_official =
        is_committee_official === "true" || is_committee_official === true;
    }

    if (req.file) {
      const { data: existing } = await userSupabase
        .from("officers")
        .select("avatar")
        .eq("id", id)
        .single();

      if (existing?.avatar) {
        await userSupabase.storage.from("officers").remove([existing.avatar]);
      }

      const ext = req.file.mimetype.split("/")[1] || "jpg";
      const avatarPath = `${id}.${ext}`;

      const { error: uploadError } = await userSupabase.storage
        .from("officers")
        .upload(avatarPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);
      updates.avatar = avatarPath;
    }

    if (Object.keys(updates).length === 0) return res.sendStatus(200);

    const { error } = await userSupabase
      .from("officers")
      .update(updates)
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      throw new ApiError(400, "Array of officer ids required.");
    }

    const token = req.token;
    const userSupabase = createUserClient(token);

    for (const id of req.body) {
      const { data: officer } = await userSupabase
        .from("officers")
        .select("avatar")
        .eq("id", id)
        .single();

      if (officer?.avatar) {
        await userSupabase.storage.from("officers").remove([officer.avatar]);
      }

      const { error } = await userSupabase
        .from("officers")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

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
      .from("officers")
      .select()
      .eq("status", "archived")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return res.status(200).json(data.map(transformOfficer));
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
    const { term_year } = req.body;
    console.log("[OFFICER ARCHIVE] ids:", ids, "term_year:", term_year ?? null);
    const { data, error } = await supabase
      .from("officers")
      .update({ status: "archived", term_year: term_year ?? "2025-2026" })
      .in("id", ids)
      .select("id, status");
    console.log("[OFFICER ARCHIVE] service key result:", JSON.stringify(data));
    console.log("[OFFICER ARCHIVE] service key error:", JSON.stringify(error));
    if (error) throw new ApiError(500, "Archive failed: " + error.message);
    if (!data || data.length === 0) {
      throw new ApiError(404, "No officers found — confirm the status column migration has run");
    }
    return res.json({ archived: data.length });
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
    const { error } = await supabase
      .from("officers")
      .update({ status: "active" })
      .in("id", ids);
    if (error) throw new ApiError(500, "Failed to restore officers");
    return res.sendStatus(200);
  }),
);

export default router;
