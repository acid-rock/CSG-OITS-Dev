// MANUAL STEP: ALTER TABLE officers ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
// MANUAL STEP: ALTER TABLE officers ADD COLUMN IF NOT EXISTS archived_at timestamptz;

import { Router } from "express";
import sharp from "sharp";
import {
  anonSupabase,
  supabase,
  createUserClient,
} from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import multer from "multer";
import { getCached, setCache, invalidateCachePrefix } from "../lib/cache.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addOfficerSchema,
  editOfficerSchema,
  deleteIdsSchema,
  archiveOfficerSchema,
  singleIdSchema,
} from "../schemas/index.js";
import { validateImageUpload } from "../lib/uploadValidation.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * @param {object}  officer        — raw DB row
 * @param {boolean} includePrivate — true for authenticated admin requests;
 *                                   includes student_number (logbook credential)
 */
const transformOfficer = (officer, includePrivate = false) => {
  const avatar = officer.avatar
    ? anonSupabase.storage.from("officers").getPublicUrl(officer.avatar).data.publicUrl
    : null;
  const result = {
    id: officer.id,
    created_at: officer.created_at,
    full_name: officer.full_name,
    position: officer.position,
    avatar: avatar,
    type: officer.type,
    socials: officer.socials,
    year_serving: officer.year_serving,
    committee: officer.committee,
    is_committee_official: officer.is_committee_official,
    status: officer.status,
    committee_memberships: officer.committee_memberships ?? [],
  };
  // student_number is excluded from public responses — it is the logbook identity
  // credential and must never appear in unauthenticated API responses.
  if (includePrivate) result.student_number = officer.student_number ?? null;
  return result;
};

// ── Read ──────────────────────────────────────────────────────────────────────

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.isAdmin ?? false;
    const pageStr = req.query.page;
    const limitStr = req.query.limit;

    if (pageStr !== undefined || limitStr !== undefined) {
      const page = parseInt(pageStr) || 1;
      const limit = parseInt(limitStr) || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Unauthenticated callers are always limited to active officers only.
      // Admin JWTs (isAdmin = true) may request archived or all records.
      const statusFilter = isAdmin ? (req.query.status || "active") : "active";

      const { data, error, count } = await anonSupabase
        .from("officers")
        .select("*", { count: "exact" })
        .eq("status", statusFilter)
        .order("created_at", { ascending: true })
        .range(from, to);
      if (error) throw new Error(error.message);

      return res.status(200).json({
        data: data.map((o) => transformOfficer(o, isAdmin)),
        total: count,
        page,
        limit,
      });
    }

    // Unauthenticated callers are always limited to active officers only.
    // Admin JWTs (isAdmin = true) may request archived or all records.
    const statusFilter = isAdmin ? (req.query.status || "active") : "active";
    const termFilter = req.query.term || null;
    const termYearFilter = req.query.term_year || null;

    // Separate cache keys for admin (includes student_number) vs public
    const cacheKey = `officers:${statusFilter}:${termFilter ?? "all"}:${isAdmin ? "private" : "public"}`;
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Helper: build the base query with or without the memberships join
    const buildQuery = (withMemberships) => {
      let q = anonSupabase
        .from("officers")
        .select(withMemberships ? "*, committee_memberships(*)" : "*")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      // status=all → return both active and archived (excluding bin'd)
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (termFilter) q = q.eq("year_serving", termFilter);
      if (termYearFilter) q = q.eq("year_serving", termYearFilter);

      return q;
    };

    // First attempt: include committee_memberships join (requires migration to have run)
    let { data, error } = await buildQuery(true);

    // Graceful fallback: if the join fails because the table doesn't exist yet,
    // retry without it so the officer list is never broken pre-migration.
    if (error && (error.code === "42P01" || error.message?.includes("committee_memberships"))) {
      console.warn("[officers GET] committee_memberships table not found — run the migration. Falling back to plain select.");
      ({ data, error } = await buildQuery(false));
    }

    if (error) throw new Error(error.message);

    const transformed = data.map((o) => transformOfficer(o, isAdmin));
    setCache(cacheKey, transformed, 60_000);
    return res.status(200).json(transformed);
  }),
);

router.get(
  "/terms",
  asyncHandler(async (req, res) => {
    const { data, error } = await anonSupabase
      .from("officers")
      .select("year_serving")
      .eq("status", "archived")
      .not("year_serving", "is", null)
      .order("year_serving", { ascending: false });
    if (error) throw new ApiError(500, error.message);

    const distinct = [...new Set((data ?? []).map((r) => r.year_serving))];
    return res.status(200).json(distinct);
  }),
);

// ── Write ─────────────────────────────────────────────────────────────────────

router.post(
  "/add",
  requireAuth,
  upload.single("avatar"),
  validate(addOfficerSchema),
  asyncHandler(async (req, res) => {
    validateImageUpload(req.file, false);
    const {
      full_name,
      position,
      type,
      socials,
      year_serving,
      student_number,
      committee,
      is_committee_official,
    } = req.body;

    if (!full_name) throw new ApiError(400, "full_name is required.");
    if (!position) throw new ApiError(400, "position is required.");
    if (!type) throw new ApiError(400, "type is required.");

    const normalizedType = type?.toLowerCase();

    const insertPayload = {
      full_name,
      position,
      type: normalizedType,
      socials: socials ?? null,
      year_serving: year_serving ?? null,
      student_number: student_number ?? null,
      committee: committee || null,
      is_committee_official:
        is_committee_official === "true" || is_committee_official === true,
      // Former officers stay status="active" — they remain on the current term's
      // roster with a "Former" badge; use Archive to end-of-term retire an officer.
      status: "active",
      term_year: null,
      avatar: null,
    };

    const { data, error: insertError } = await supabase
      .from("officers")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        throw new ApiError(
          409,
          "An officer with this name and term already exists.",
        );
      }
      throw new ApiError(500, "Failed to add officer: " + insertError.message);
    }

    // Avatar upload — failure must NOT cause the officer add to fail
    let avatarPath = null;
    if (req.file) {
      try {
        const fileName = `${data.id}.webp`;
        const compressed = await sharp(req.file.buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const { error: uploadError } = await supabase.storage
          .from("officers")
          .upload(fileName, compressed, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
          });
        if (!uploadError) {
          avatarPath = fileName;
          await supabase
            .from("officers")
            .update({ avatar: avatarPath })
            .eq("id", data.id);
        } else {
          console.error(
            "[ADD OFFICER] Avatar upload failed:",
            uploadError.message,
          );
        }
      } catch (avatarEx) {
        console.error("[ADD OFFICER] Avatar exception:", avatarEx.message);
      }
    }

    invalidateCachePrefix("officers:");
    return res.status(201).json({ ...data, avatar: avatarPath });
  }),
);

router.post(
  "/edit",
  requireAuth,
  upload.single("avatar"),
  validate(editOfficerSchema),
  asyncHandler(async (req, res) => {
    validateImageUpload(req.file, false);
    const {
      id,
      full_name,
      position,
      type,
      socials,
      year_serving,
      student_number,
      committee,
      is_committee_official,
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
    if (student_number !== undefined)
      updates.student_number = student_number || null;
    if (committee !== undefined)
      updates.committee = committee || null; // committees.id is UUID — never parseInt
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

      const avatarPath = `${id}.webp`;
      const compressed = await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: uploadError } = await supabase.storage
        .from("officers")
        .upload(avatarPath, compressed, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (uploadError) throw new ApiError(500, uploadError.message);

      if (existing?.avatar && existing.avatar !== avatarPath) {
        await supabase.storage.from("officers").remove([existing.avatar]);
      }

      updates.avatar = avatarPath;
    }

    if (Object.keys(updates).length === 0) return res.sendStatus(200);

    const { error } = await userSupabase
      .from("officers")
      .update(updates)
      .eq("id", id);
    if (error) throw new Error(error.message);

    invalidateCachePrefix("officers:");
    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids required");
    }

    for (const id of ids) {
      const { data: officer } = await supabase
        .from("officers")
        .select("avatar")
        .eq("id", id)
        .single();
      if (officer?.avatar) {
        await supabase.storage.from("officers").remove([officer.avatar]);
      }
    }

    const { error } = await supabase.from("officers").delete().in("id", ids);
    if (error) throw new ApiError(500, "Delete failed: " + error.message);

    invalidateCachePrefix("officers:");
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
    // /archived is requireAuth — always include private fields
    return res.status(200).json(data.map((o) => transformOfficer(o, true)));
  }),
);

router.post(
  "/archive",
  requireAuth,
  validate(archiveOfficerSchema),
  asyncHandler(async (req, res) => {
    const { id, term_year } = req.body;
    const { data, error } = await supabase
      .from("officers")
      .update({ status: "archived", term_year: term_year ?? "2025-2026" })
      .eq("id", id)
      .select("id, status");
    if (error) throw new ApiError(500, "Archive failed: " + error.message);
    if (!data || data.length === 0) {
      throw new ApiError(
        404,
        "No officers found — confirm the status column migration has run",
      );
    }
    invalidateCachePrefix("officers:");
    return res.json({ archived: data.length });
  }),
);

router.post(
  "/restore",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase
      .from("officers")
      .update({ status: "active" })
      .eq("id", id);
    if (error) throw new ApiError(500, "Failed to restore officers");
    invalidateCachePrefix("officers:");
    return res.sendStatus(200);
  }),
);

// ── Bin (soft-delete: sets deleted_at) ───────────────────────────────────────

router.post(
  "/bin",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase
      .from("officers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new ApiError(500, "Failed to move officer to bin: " + error.message);
    invalidateCachePrefix("officers:");
    return res.json({ success: true });
  }),
);

router.post(
  "/restore-from-bin",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase
      .from("officers")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) throw new ApiError(500, "Failed to restore officer from bin: " + error.message);
    invalidateCachePrefix("officers:");
    return res.json({ success: true });
  }),
);

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("officers")
      .select()
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.json(data);
  }),
);

export default router;
