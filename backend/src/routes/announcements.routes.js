// MANUAL STEP REQUIRED: In Supabase dashboard, add to bulletin table:
//   is_pinned  boolean NOT NULL DEFAULT false
//   is_archived boolean NOT NULL DEFAULT false
//   archived_at timestamptz
// Then run:
//   UPDATE bulletin SET is_pinned   = false WHERE is_pinned   IS NULL;
//   UPDATE bulletin SET is_archived = false WHERE is_archived IS NULL;

import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { anonSupabase, supabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { auditLogger } from "../middlewares/audit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addAnnouncementSchema,
  editAnnouncementSchema,
  deleteIdsSchema,
  singleIdSchema,
} from "../schemas/index.js";
import { validateImageUpload } from "../lib/uploadValidation.js";
import { sanitizeContent } from "../lib/sanitize.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// MANUAL STEP: To track individual bulletin views, create a Supabase DB function:
//   increment_views(row_id uuid, table_name text) — UPDATE SET views = views + 1
// Then call supabase.rpc('increment_views', { row_id, table_name: 'bulletin' }) per item.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    let { data, error } = await anonSupabase
      .from("bulletin")
      .select()
      .eq("is_archived", false)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const payload = data.map((row) => {
      const imgPath = `${row.id}.jpg`;
      const imgUrl = anonSupabase.storage.from("bulletin").getPublicUrl(imgPath)
        .data.publicUrl;

      return {
        id: row.id,
        imgUrl: imgUrl,
        title: row.title,
        content: row.content,
        date: row.created_at,
        created_at: row.created_at,
        is_pinned: row.is_pinned ?? false,
        category: row.category ?? 'CSG Updates',
        owner_id: row.owner_id ?? null,
      };
    });

    return res.status(200).json(payload);
  }),
);

router.post(
  "/add",
  requireAuth,
  upload.single("image"),
  validate(addAnnouncementSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    validateImageUpload(req.file, true);
    const token = req.token;
    const { title, content, category } = req.body;
    const sanitizedContent = sanitizeContent(content);

    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase
      .from("bulletin")
      .upsert(
        {
          title: title,
          content: sanitizedContent,
          owner_id: req.user.sub,
          category: category || 'CSG Updates',
        },
        { onConflict: "title" },
      )
      .select();

    if (error) throw new Error(error.message);

    const imgPath = `${data[0].id}.jpg`;
    const compressed = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const { data: imgData, error: uploadError } = await userSupabase.storage
      .from("bulletin")
      .upload(imgPath, compressed, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  upload.single("image"), // optional — only present when the admin replaces the cover image
  validate(editAnnouncementSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    validateImageUpload(req.file, false);
    if (!req.body) throw new ApiError(400, "No valid request body is found.");
    const { id, title, content, category } = req.body;
    const sanitizedContent = sanitizeContent(content);
    const token = req.token;

    const userSupabase = createUserClient(token);
    const updates = { title, content: sanitizedContent };
    if (category) updates.category = category;
    const { error } = await userSupabase
      .from("bulletin")
      .update(updates)
      .eq("id", id);
    if (error) throw new Error(error.message);

    // Replace the cover image only when a new file was uploaded
    if (req.file) {
      const imgPath = `${id}.jpg`;
      const compressed = await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      const { error: uploadError } = await userSupabase.storage
        .from("bulletin")
        .upload(imgPath, compressed, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (uploadError) throw new Error(uploadError.message);
    }

    return res.sendStatus(200);
  }),
);

router.post(
  "/pin",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    // Unpin all announcements first
    await userSupabase.from("bulletin").update({ is_pinned: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    // Pin the selected one
    const { error } = await userSupabase.from("bulletin").update({ is_pinned: true }).eq("id", id);
    if (error) throw new ApiError(500, "Pin failed: " + error.message);

    return res.sendStatus(200);
  }),
);

// Unpin a specific announcement (without pinning another one)
router.post(
  "/unpin",
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("bulletin")
      .update({ is_pinned: false })
      .eq("id", id);
    if (error) throw new ApiError(500, "Unpin failed: " + error.message);
    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  validate(deleteIdsSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);

    for (const id of req.body.ids) {
      const imgPath = `${id}.jpg`;
      const { error } = await userSupabase
        .from("bulletin")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);

      const { data, error: deleteImgError } = await userSupabase.storage
        .from("bulletin")
        .remove([imgPath]);
      if (deleteImgError) throw new Error(deleteImgError.message);
    }

    return res.sendStatus(200);
  }),
);

// ── Archive / Restore ─────────────────────────────────────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("bulletin")
      .select()
      .eq("is_archived", true)
      .is("deleted_at", null)
      .order("archived_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);

    const payload = data.map((row) => {
      const imgPath = `${row.id}.jpg`;
      const imgUrl = anonSupabase.storage
        .from("bulletin")
        .getPublicUrl(imgPath).data.publicUrl;
      return {
        id: row.id,
        imgUrl,
        title: row.title,
        content: row.content,
        date: row.created_at,
        is_pinned: row.is_pinned ?? false,
        is_archived: true,
        archived_at: row.archived_at,
        owner_id: row.owner_id ?? null,
      };
    });

    return res.status(200).json(payload);
  }),
);

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("bulletin")
      .select()
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);

    const payload = data.map((row) => {
      const imgPath = `${row.id}.jpg`;
      const imgUrl = anonSupabase.storage
        .from("bulletin")
        .getPublicUrl(imgPath).data.publicUrl;
      return {
        id: row.id,
        imgUrl,
        title: row.title,
        content: row.content,
        date: row.created_at,
        deleted_at: row.deleted_at,
        owner_id: row.owner_id ?? null,
      };
    });

    return res.status(200).json(payload);
  }),
);

router.post(
  "/archive",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("bulletin")
      .update({ is_archived: true, archived_at: now })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const { error } = await supabase
      .from("bulletin")
      .update({ is_archived: false, archived_at: null })
      .in("id", ids);
    if (error) throw new ApiError(500, "Restore failed: " + error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/bin",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const { error } = await supabase
      .from("bulletin")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore-from-bin",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const { error } = await supabase
      .from("bulletin")
      .update({ deleted_at: null, is_archived: false })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

export default router;
