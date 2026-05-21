// MANUAL STEP REQUIRED: In Supabase dashboard, add to the documents table:
//   is_deleted  boolean      NOT NULL DEFAULT false
//   deleted_at  timestamptz  NULL
//   is_archived boolean      NOT NULL DEFAULT false
//   archived_at timestamptz  NULL
//   term        text         NULL  (e.g. "S.Y. 2024-2025")
// After adding the columns run:
//   UPDATE documents SET is_deleted  = false WHERE is_deleted  IS NULL;
//   UPDATE documents SET is_archived = false WHERE is_archived IS NULL;
// Do NOT attempt to run this migration from backend code.

import { Router } from "express";
import axios from "axios";
import ApiError from "../lib/apiError.js";
import { createUserClient, supabase } from "../lib/supabaseClient.js";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { auditLogger } from "../middlewares/audit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addDocumentSchema,
  editDocumentSchema,
  deleteIdsSchema,
} from "../schemas/index.js";
import { validatePdfUpload } from "../lib/uploadValidation.js";
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
    term: file.term ?? null,
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
        .eq("is_archived", false)
        .is("deleted_at", null)
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
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);

    return res.status(200).json(files.map(transformDocument));
  }),
);

// ── Admin write routes ────────────────────────────────────────────────────────

router.post(
  "/add",
  upload.single("file"),
  requireAuth,
  validate(addDocumentSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    validatePdfUpload(req.file, true);
    const token = req.token;
    const { name, type, description } = req.body;
    const boxes = req.body.boxes;

    const filepath = `${type}/${name}.pdf`;

    const userSupabase = createUserClient(token);

    // Parse boxes — frontend sends JSON.stringify([...]); may be absent or empty
    let parsedBoxes = [];
    try { parsedBoxes = boxes ? JSON.parse(boxes) : []; } catch { parsedBoxes = []; }

    let redacted;
    let contentType;

    if (parsedBoxes.length > 0) {
      // Boxes selected — send to redaction microservice
      let formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      formData.append("boxes", JSON.stringify(parsedBoxes));

      const response = await axios.post(`${REDACT_URL}/api/v1/redact`, formData, {
        headers: formData.getHeaders(),
        responseType: "arraybuffer",
        maxBodyLength: Infinity,
      });
      redacted = Buffer.from(response.data);
      contentType = response.headers["content-type"];
    } else {
      // No boxes — upload the original PDF without redaction
      redacted = req.file.buffer;
      contentType = req.file.mimetype;
    }

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

    const term = req.body.term;
    const { error: tableError } = await userSupabase.from("documents").upsert(
      { id: data.id, file_path: filepath, description, term: term ?? null, owner_id: req.user.sub, is_deleted: false },
      { onConflict: "id" },
    );
    if (tableError) throw new Error(tableError.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  upload.none(), // parse multipart/form-data text fields without accepting a file upload
  requireAuth,
  validate(editDocumentSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    const token = req.token;
    const { name, description, type, id, term } = req.body;

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
      .update({ file_path: filepath, description, term: term ?? null })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);

    const oldPath = oldFile[0].file_path;
    if (oldPath !== filepath) {
      const { error: copyError } = await userSupabase.storage
        .from("documents")
        .copy(oldPath, filepath);

      if (copyError) {
        const { data: fileBlob } = await userSupabase.storage
          .from("documents")
          .download(oldPath);
        if (fileBlob) {
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filepath, fileBlob, { upsert: true });
          if (uploadError) throw new ApiError(500, uploadError.message);
        } else {
          throw new ApiError(500, copyError.message);
        }
      }

      const { error: deleteError } = await userSupabase.storage
        .from("documents")
        .remove([oldPath]);
      if (deleteError) throw new ApiError(500, deleteError.message);
    }

    return res.sendStatus(200);
  }),
);

// ── Soft delete (moves to bin) ────────────────────────────────────────────────

router.delete(
  "/delete",
  requireAuth,
  validate(deleteIdsSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);
    const deletedAt = new Date().toISOString();

    for (const id of req.body.ids) {
      const { error } = await userSupabase
        .from("documents")
        .update({ is_deleted: true, deleted_at: deletedAt })
        .eq("id", id);
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
      .not("deleted_at", "is", null)
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
  "/restore-from-bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids must be a non-empty array");
    }

    const { data, error } = await supabase
      .from("documents")
      .update({ is_deleted: false, is_archived: false, archived_at: null, deleted_at: null })
      .in("id", ids)
      .select();
    if (error) throw new ApiError(500, "Failed to restore documents: " + error.message);
    if (!data || data.length === 0) {
      throw new ApiError(404, "No documents found with those IDs, or they are not in the bin");
    }

    return res.json({ restored: data.length });
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

// ── Archive / Restore ─────────────────────────────────────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: files, error } = await supabase
      .from("documents")
      .select("*")
      .eq("is_archived", true)
      .is("deleted_at", null)
      .order("archived_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(files.map((f) => ({ ...transformDocument(f), archived_at: f.archived_at })));
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
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Refuse to archive documents that are already in the bin
    const { data: inBin } = await userSupabase
      .from("documents")
      .select("id")
      .in("id", ids)
      .eq("is_deleted", true);
    if (inBin && inBin.length > 0) {
      throw new ApiError(400, "Document is in the bin. Restore it from the bin first.");
    }

    const now = new Date().toISOString();
    const { error } = await userSupabase
      .from("documents")
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
      .from("documents")
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
      .from("documents")
      .update({ deleted_at: new Date().toISOString(), is_deleted: true })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

export default router;
