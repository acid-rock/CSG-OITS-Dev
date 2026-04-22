import { Router } from "express";
import axios from "axios";
import { createUserClient, supabase } from "../lib/supabaseClient.js";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import FormData from "form-data";
import "dotenv/config";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";

const REDACT_URL = process.env.PDF_REDACT_URL || "";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = Router();

// GET all documents with their public URLs and metadata
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data: files, error } = await supabase.from("documents").select("*");
    if (error) throw new Error(error.message);

    const filepaths = files.map((file) => {
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
    });

    return res.status(200).json(filepaths);
  }),
);

// INSERT new document with file upload and redaction
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
      .upload(filepath, redacted, {
        contentType,
        upsert: true,
      });

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
      {
        headers: formData.getHeaders(),
        responseType: "arraybuffer",
        maxBodyLength: Infinity,
      },
    );

    const thumbnail = Buffer.from(thumbnailResponse.data);
    const thumbnailContentType = thumbnailResponse.headers["content-type"];

    const { error: thumbnailError } = await userSupabase.storage
      .from("thumbnails")
      .upload(imgName, thumbnail, {
        thumbnailContentType,
        upsert: true,
      });

    if (thumbnailError) throw new Error(thumbnailError.message);

    const { error: tableError } = await userSupabase.from("documents").upsert(
      {
        id: data.id,
        file_path: filepath,
        description: description,
        owner_id: req.user.sub,
      },
      { onConflict: "id" },
    );

    if (tableError) throw new Error(tableError.message);

    return res.send(200);
  }),
);

// UPDATE document metadata and optionally replace file (with redaction)
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
      .eq("id", id)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    if (!oldFile?.file_path) throw new Error("Invalid file path.");
    const oldPath = oldFile.file_path;

    const { error: copyError } = await userSupabase.storage
      .from("documents")
      .copy(oldPath, filepath);
    if (copyError) throw new Error(copyError.message);

    const { error: deleteError } = await userSupabase.storage
      .from("documents")
      .remove([oldPath]);
    if (deleteError) throw new Error(deleteError.message);

    const { error: updateError } = await userSupabase
      .from("documents")
      .update({
        file_path: filepath,
        description: description,
      })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    return res.sendStatus(200);
  }),
);

// DELETE document(s) and their thumbnails
router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(404, "No valid request body is found.");

    // Support both single ID and array of IDs for deletion
    const ids = Array.isArray(req.body) ? req.body : [req.body];
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { data: files, error: fetchError } = await userSupabase
      .from("documents")
      .select()
      .in("id", ids);
    if (fetchError) throw new Error(fetchError.message);
    const filePaths = files.map((file) => file.file_path);
    const thumbnailPaths = files.map((file) => `thumbnails/${file.id}.png`);

    const { error: deleteError } = await userSupabase.storage
      .from("documents")
      .remove(filePaths);
    if (deleteError) throw new Error(deleteError.message);

    const { error: thumbnailDeleteError } = await userSupabase.storage
      .from("thumbnails")
      .remove(thumbnailPaths);
    if (thumbnailDeleteError) throw new Error(thumbnailDeleteError.message);

    const { error: tableError } = await userSupabase
      .from("documents")
      .delete()
      .in("id", ids);
    if (tableError) throw new Error(tableError.message);

    return res.send(200);
  }),
);

export default router;
