import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { anonSupabase, supabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import { getCached, setCache, invalidateCachePrefix } from "../lib/cache.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addOrganizationSchema,
  editOrganizationSchema,
  singleIdSchema,
} from "../schemas/index.js";
import { validateImageUpload } from "../lib/uploadValidation.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const getLogoUrl = (logo_path) => {
  if (!logo_path) return null;
  return anonSupabase.storage.from("organizations").getPublicUrl(logo_path).data.publicUrl;
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cacheKey = "organizations:active";
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    const { data, error } = await anonSupabase
      .from("organizations")
      .select("id, name, description, facebook_link, logo_path, created_at, org_type, parent_id")
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throw new ApiError(500, error.message);

    const result = data.map((org) => ({
      id:            org.id,
      name:          org.name,
      description:   org.description,
      facebook_link: org.facebook_link,
      created_at:    org.created_at,
      org_type:      org.org_type,
      parent_id:     org.parent_id,
      logo_url:      getLogoUrl(org.logo_path),
    }));
    setCache(cacheKey, result, 60_000);
    return res.status(200).json(result);
  }),
);

router.post(
  "/add",
  requireAuth,
  upload.single("logo"),
  validate(addOrganizationSchema),
  asyncHandler(async (req, res) => {
    await validateImageUpload(req.file, false);
    const { name, description, facebook_link, org_type, parent_id } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const { data, error: insertError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        description: description || null,
        facebook_link: facebook_link || null,
        org_type: org_type || null,
        parent_id: parent_id || null,
      })
      .select()
      .single();
    if (insertError) throw new ApiError(500, insertError.message);

    if (req.file) {
      const logoPath = `${data.id}.webp`;
      const compressed = await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      const { error: uploadError } = await supabase.storage
        .from("organizations")
        .upload(logoPath, compressed, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (uploadError) throw new ApiError(500, uploadError.message);

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ logo_path: logoPath })
        .eq("id", data.id);
      if (updateError) throw new ApiError(500, updateError.message);

      invalidateCachePrefix("organizations:");
      return res.status(200).json({ ...data, logo_path: logoPath, logo_url: getLogoUrl(logoPath) });
    }

    invalidateCachePrefix("organizations:");
    return res.status(200).json({ ...data, logo_url: null });
  }),
);

router.post(
  "/edit",
  requireAuth,
  upload.single("logo"),
  validate(editOrganizationSchema),
  asyncHandler(async (req, res) => {
    await validateImageUpload(req.file, false);
    const { id, name, description, facebook_link, org_type, parent_id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");

    const updates = {
      name: name.trim(),
      description: description || null,
      facebook_link: facebook_link || null,
      org_type: org_type || null,
      // Allow explicitly clearing parent by sending '' or null
      parent_id: parent_id || null,
    };

    if (req.file) {
      const logoPath = `${id}.webp`;
      const compressed = await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      const { error: uploadError } = await supabase.storage
        .from("organizations")
        .upload(logoPath, compressed, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (uploadError) throw new ApiError(500, uploadError.message);
      updates.logo_path = logoPath;
    }

    const { error } = await supabase.from("organizations").update(updates).eq("id", id);
    if (error) throw new ApiError(500, error.message);

    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");

    const { data: org } = await supabase
      .from("organizations")
      .select("logo_path")
      .eq("id", id)
      .single();

    if (org?.logo_path) {
      await supabase.storage.from("organizations").remove([org.logo_path]);
    }

    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) throw new ApiError(500, error.message);

    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

// ── Archive / Bin / Restore (requires Migration G) ──────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("is_archived", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data.map((org) => ({ ...org, logo_url: getLogoUrl(org.logo_path) })));
  }),
);

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data.map((org) => ({ ...org, logo_url: getLogoUrl(org.logo_path) })));
  }),
);

router.post(
  "/archive",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase.from("organizations").update({ is_archived: true }).eq("id", id);
    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase.from("organizations").update({ is_archived: false }).eq("id", id);
    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

router.post(
  "/bin",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase.from("organizations").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore-from-bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase.from("organizations").update({ deleted_at: null, is_archived: false }).eq("id", id);
    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("organizations:");
    return res.sendStatus(200);
  }),
);

export default router;
