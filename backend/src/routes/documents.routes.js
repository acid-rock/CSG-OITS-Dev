// MANUAL STEP REQUIRED: In Supabase dashboard, add to the documents table:
//   is_deleted  boolean      NOT NULL DEFAULT false
//   deleted_at  timestamptz  NULL
// After adding the columns run:
//   UPDATE documents SET is_deleted = false WHERE is_deleted IS NULL;
// Do NOT attempt to run this migration from backend code.

import { Router } from "express";
import axios from "axios";
import ApiError from "../lib/apiError.js";
import { createUserClient, supabase } from "../lib/supabaseClient.js";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import FormData from "form-data";
import "dotenv/config";
import asyncHandler from "express-async-handler";

const REDACT_URL = process.env.PDF_REDACT_URL || "";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// MANUAL STEP: To track individual document views, create a Supabase DB function:
//   increment_views(row_id uuid, table_name text) — UPDATE SET views = views + 1
// Then call supabase.rpc('increment_views', { row_id, table_name: 'documents' }) per item.

const transformDocument = (file) => {
  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(file.file_path);
  const thumbnail = supabase.storage
    .from("thumbnails")
    .getPublicUrl(`${file.id}.png`).data.publicUrl;
  return {
    id: file.id,
    createdAt: file.created_at,
    name: file.file_path,
    description: file.description,
    category: file.file_path.split("/")[0],
    url: data.publicUrl,
    thumbnail: thumbnail,
  };
};

// ── Public GET — active (non-deleted) documents only ─────────────────────────

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

      const { data: files, error, count } = await supabase
        .from("documents")
        .select("*", { count: "exact" })
        .eq("is_deleted", false)
        .range(from, to);
      if (error) throw new Error(error.message);

      return res.status(200).json({
        data: files.map(transformDocument),
        total: count,
        page,
        limit,
      });
    }

    const { data: files, error } = await supabase
      .from("documents")
      .select("*")
      .eq("is_deleted", false);
    if (error) throw new Error(error.message);

    return res.status(200).json(files.map(transformDocument));
  }),
);

// ── Admin write routes ────────────────────────────────────────────────────────

router.post(
  "/add",
  upload.single("file"),
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const { name, type, boxes, description } = req.body;

    const filepath = `${type}/${name}.pdf`;

    const userSupabase = createUserClient(token);
    let formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append("boxes", boxes);

    const response = await axios.post(`${REDACT_URL}/api/v1/redact`, formData, {
      headers: formData.getHeaders(),
      responseType: "arraybuffer",
      maxBodyLength: Infinity,
    });

    const redacted = Buffer.from(response.data);
    const contentType = response.headers["content-type"];

    const { data, error } = await userSupabase.storage
      .from("documents")
      .upload(filepath, redacted, { contentType, upsert: true });
    if (error) throw new Error(error.message);

    formData = new FormData();
    const imgName = `${data.id}.png`;
    formData.append("name", imgName);
    formData.append("file", redacted, {
      filename: imgName,
      contentType: req.file.mimetype,
    });

    const thumbnailResponse = await axios.post(
      `${REDACT_URL}/api/v1/thumbnail/create`,
      formData,
      { headers: formData.getHeaders(), responseType: "arraybuffer", maxBodyLength: Infinity },
    );

    const thumbnail = Buffer.from(thumbnailResponse.data);
    const thumbnailContentType = thumbnailResponse.headers["content-type"];

    const { error: thumbnailError } = await userSupabase.storage
      .from("thumbnails")
      .upload(imgName, thumbnail, { thumbnailContentType, upsert: true });
    if (thumbnailError) throw new Error(thumbnailError.message);

    const { error: tableError } = await userSupabase.from("documents").upsert(
      { id: data.id, file_path: filepath, description, owner_id: req.user.sub, is_deleted: false },
      { onConflict: "id" },
    );
    if (tableError) throw new Error(tableError.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const { name, description, type, id } = req.body;

    if (!name || !description || !type || !id) {
      throw new ApiError(400, "All fields are required.");
    }
    const filepath = `${type}/${name}.pdf`;

    const userSupabase = createUserClient(token);
    const { data: oldFile, error: fetchError } = await userSupabase
      .from("documents")
      .select()
      .eq("id", id);
    if (fetchError) throw new Error(fetchError.message);

    const { error: updateError } = await userSupabase
      .from("documents")
      .update({ file_path: filepath, description })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);

    const { error: copyError } = await userSupabase.storage
      .from("documents")
      .copy(oldFile[0].file_path, filepath);
    const { error: deleteError } = await userSupabase.storage
      .from("documents")
      .remove([oldFile[0].file_path]);

    if (copyError) throw new Error(copyError.message);
    if (deleteError) throw new Error(deleteError.message);

    return res.sendStatus(200);
  }),
);

// ── Soft delete (moves to bin) ────────────────────────────────────────────────

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      throw new ApiError(400, "Array of document objects required.");
    }

    const token = req.token;
    const userSupabase = createUserClient(token);
    const deletedAt = new Date().toISOString();

    for (const document of req.body) {
      const { error } = await userSupabase
        .from("documents")
        .update({ is_deleted: true, deleted_at: deletedAt })
        .eq("id", document.id);
      if (error) throw new Error(error.message);
    }

    return res.sendStatus(200);
  }),
);

// ── Bin routes ────────────────────────────────────────────────────────────────

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: files, error } = await supabase
      .from("documents")
      .select("*")
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });
    if (error) throw new Error(error.message);

    const payload = files.map((file) => ({
      ...transformDocument(file),
      deleted_at: file.deleted_at,
    }));

    return res.status(200).json(payload);
  }),
);

router.post(
  "/restore",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      throw new ApiError(400, "Array of document ids required.");
    }

    const token = req.token;
    const userSupabase = createUserClient(token);

    for (const id of req.body) {
      const { error } = await userSupabase
        .from("documents")
        .update({ is_deleted: false, deleted_at: null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

    return res.sendStatus(200);
  }),
);

router.delete(
  "/bin/purge",
  requireAuth,
  asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const token = req.token;
    const userSupabase = createUserClient(token);

    let query = userSupabase
      .from("documents")
      .select("*")
      .eq("is_deleted", true);

    // If specific IDs provided, purge only those regardless of age.
    // If no IDs provided, purge all items older than 30 days.
    if (Array.isArray(req.body) && req.body.length > 0) {
      query = query.in("id", req.body);
    } else {
      query = query.lt("deleted_at", thirtyDaysAgo.toISOString());
    }

    const { data: files, error } = await query;
    if (error) throw new Error(error.message);

    for (const file of files) {
      await userSupabase.storage.from("documents").remove([file.file_path]);
      await userSupabase.storage.from("thumbnails").remove([`${file.id}.png`]);
      await userSupabase.from("documents").delete().eq("id", file.id);
    }

    return res.status(200).json({ purged: files.length });
  }),
);

export default router;
