// NOTE: committees.id is UUID (gen_random_uuid()), NOT integer.
// All parseInt() calls that were here have been removed — use raw UUID strings.

import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { anonSupabase, supabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import { getCached, setCache, invalidateCachePrefix } from "../lib/cache.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateImageUpload } from "../lib/uploadValidation.js";
import {
  addCommitteeSchema,
  editCommitteeSchema,
  committeeIdsSchema,
} from "../schemas/index.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/** Resolve a storage path to a public URL from the committees bucket. */
const getCoverUrl = (path) => {
  if (!path) return null;
  return anonSupabase.storage.from("committees").getPublicUrl(path).data.publicUrl;
};

/**
 * Build a map of { committeeId → storagePath } by listing the committees bucket.
 * Matches files whose name starts with a valid UUID (e.g. "abc123-….jpg").
 * Result is cached for 60 s under the same key as the committee list so a
 * single cache invalidation clears both.
 */
const COVER_MAP_KEY = "committees:cover_map";
const fetchCoverMap = async () => {
  const cached = getCached(COVER_MAP_KEY);
  if (cached) return cached;

  const { data: files } = await anonSupabase.storage.from("committees").list("", { limit: 500 });
  const map = {};
  for (const f of files ?? []) {
    // Match UUID prefix: 8-4-4-4-12 hex chars followed by optional extension
    const match = f.name.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (match) map[match[1]] = f.name;
  }
  setCache(COVER_MAP_KEY, map, 60_000);
  return map;
};

/**
 * Attach cover_image_url to each row.
 * Priority: explicit cover_image_path stored in DB → auto-discovered file in
 * the committees bucket whose name starts with the committee UUID.
 */
const withCoverUrl = async (rows) => {
  const coverMap = await fetchCoverMap();
  return rows.map((c) => {
    const path = c.cover_image_path || coverMap[c.id] || null;
    return { ...c, cover_image_url: getCoverUrl(path) };
  });
};

// ── Read ──────────────────────────────────────────────────────────────────────

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status ?? "active";
    const cacheKey = `committees:${status}`;
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Explicitly exclude duty_pin from public responses
    const { data, error } = await anonSupabase
      .from("committees")
      .select("id, name, status, chair_name, vice_chair_name, description, cover_image_path")
      .eq("status", status)
      .is("deleted_at", null)  // exclude bin items
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);

    const withUrls = await withCoverUrl(data);
    const result = withUrls.map(({ cover_image_path, ...rest }) => rest);
    setCache(cacheKey, result, 60_000);
    return res.status(200).json(result);
  }),
);

// ── Write ─────────────────────────────────────────────────────────────────────

router.post(
  "/add",
  requireAuth,
  validate(addCommitteeSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const { data, error } = await supabase
      .from("committees")
      .insert({ name: name.trim(), status: "active" })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);

    invalidateCachePrefix("committees:");
    return res.status(200).json(data);
  }),
);

router.post(
  "/edit",
  requireAuth,
  validate(editCommitteeSchema),
  asyncHandler(async (req, res) => {
    const { id, name, chair_name, vice_chair_name, description } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const updatePayload = { name: name.trim() };
    // Only include optional fields if they were explicitly sent
    if (chair_name !== undefined)      updatePayload.chair_name      = chair_name?.trim()      || null;
    if (vice_chair_name !== undefined) updatePayload.vice_chair_name = vice_chair_name?.trim() || null;
    if (description !== undefined)     updatePayload.description     = description?.trim()     || null;

    const { error } = await supabase
      .from("committees")
      .update(updatePayload)
      .eq("id", id);
    if (error) throw new ApiError(500, "Update failed: " + error.message);

    invalidateCachePrefix("committees:");
    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  validate(committeeIdsSchema),
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "ids must be a non-empty array");
    const { error } = await supabase.from("committees").delete().in("id", ids);
    if (error) throw new ApiError(500, "Delete failed: " + error.message);
    invalidateCachePrefix("committees:");
    return res.sendStatus(200);
  }),
);

// ── Archive / Restore ─────────────────────────────────────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Uses status='archived' column (not is_archived — that column does not exist)
    const { data, error } = await supabase
      .from("committees")
      .select("*")
      .eq("status", "archived")
      .is("deleted_at", null)
      .order("id", { ascending: true });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(await withCoverUrl(data ?? []));
  }),
);

router.post(
  "/archive",
  requireAuth,
  validate(committeeIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }

    const { error } = await supabase
      .from("committees")
      .update({ status: "archived" })
      .in("id", ids);
    if (error) throw new ApiError(500, "Archive failed: " + error.message);
    invalidateCachePrefix("committees:");
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore",
  requireAuth,
  validate(committeeIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const { error } = await supabase
      .from("committees")
      .update({ status: "active" })
      .in("id", ids);
    if (error) throw new ApiError(500, "Restore failed: " + error.message);
    invalidateCachePrefix("committees:");
    return res.sendStatus(200);
  }),
);

// ── Bin (soft-delete: sets deleted_at) ───────────────────────────────────────

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("committees")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.json(await withCoverUrl(data ?? []));
  }),
);

router.post(
  "/bin",
  requireAuth,
  validate(committeeIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "ids array is required.");
    const { error } = await supabase
      .from("committees")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new ApiError(500, "Move to bin failed: " + error.message);
    invalidateCachePrefix("committees:");
    return res.json({ success: true });
  }),
);

router.post(
  "/restore-from-bin",
  requireAuth,
  validate(committeeIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      throw new ApiError(400, "ids array is required.");
    const { error } = await supabase
      .from("committees")
      .update({ deleted_at: null })
      .in("id", ids);
    if (error) throw new ApiError(500, "Restore from bin failed: " + error.message);
    invalidateCachePrefix("committees:");
    return res.json({ success: true });
  }),
);

// ── Member management ────────────────────────────────────────────────────────
// Assign or remove officers from a committee in one round-trip.
// Body: { committee_id: uuid, add: [uuid, ...], remove: [uuid, ...] }
// add    → sets officer.committee = committee_id
// remove → sets officer.committee = null

router.post(
  "/update-members",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { committee_id, add = [], remove = [] } = req.body;
    if (!committee_id) throw new ApiError(400, "committee_id is required.");

    const ops = [];
    if (add.length) {
      ops.push(
        supabase.from("officers").update({ committee: committee_id }).in("id", add),
      );
    }
    if (remove.length) {
      ops.push(
        supabase.from("officers").update({ committee: null }).in("id", remove),
      );
    }

    const results = await Promise.all(ops);
    for (const { error } of results) {
      if (error) throw new ApiError(500, "Member update failed: " + error.message);
    }

    invalidateCachePrefix("officers:");
    invalidateCachePrefix("committees:");
    return res.sendStatus(200);
  }),
);

// ── Cover image upload ────────────────────────────────────────────────────────

router.post(
  "/upload-cover",
  requireAuth,
  upload.single("cover"),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (!req.file) throw new ApiError(400, "cover image file is required.");
    await validateImageUpload(req.file, true);

    const coverPath = `${id}.webp`;
    const compressed = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const { error: uploadError } = await supabase.storage
      .from("committees")
      .upload(coverPath, compressed, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (uploadError) throw new ApiError(500, "Storage upload failed: " + uploadError.message);

    const { error: updateError } = await supabase
      .from("committees")
      .update({ cover_image_path: coverPath })
      .eq("id", id);
    if (updateError) throw new ApiError(500, "DB update failed: " + updateError.message);

    invalidateCachePrefix("committees:");  // clears committee list + cover map
    return res.status(200).json({ cover_image_url: getCoverUrl(coverPath) });
  }),
);

export default router;
