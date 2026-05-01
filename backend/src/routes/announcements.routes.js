// MANUAL STEP REQUIRED: In Supabase dashboard, add to bulletin table:
//   is_pinned boolean NOT NULL DEFAULT false
// Then run: UPDATE bulletin SET is_pinned = false WHERE is_pinned IS NULL;

import { Router } from "express";
import multer from "multer";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";

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
        is_pinned: row.is_pinned ?? false,
      };
    });

    return res.status(200).json(payload);
  }),
);

router.post(
  "/add",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const token = req.token;
    const { title, content } = req.body;

    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase
      .from("bulletin")
      .upsert(
        {
          title: title,
          content: content,
          owner_id: req.user.sub,
        },
        { onConflict: "title" },
      )
      .select();

    if (error) throw new Error(error.message);

    const imgPath = `${data[0].id}.jpg`;
    const { data: imgData, error: uploadError } = await userSupabase.storage
      .from("bulletin")
      .upload(imgPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");
    const { id, title, content } = req.body;
    const token = req.token;

    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("bulletin")
      .update({
        id: id,
        title: title,
        content: content,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

router.post(
  "/pin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id, is_pinned } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    if (typeof is_pinned !== "boolean") {
      throw new ApiError(400, "is_pinned must be a boolean.");
    }

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { error } = await userSupabase
      .from("bulletin")
      .update({ is_pinned })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);

    for (const item of req.body) {
      const imgPath = `${item.id}.jpg`;
      const { error } = await userSupabase
        .from("bulletin")
        .delete()
        .eq("id", item.id);
      if (error) throw new Error(error.message);

      const { data, error: deleteImgError } = await userSupabase.storage
        .from("bulletin")
        .remove([imgPath]);
      if (deleteImgError) throw new Error(deleteImgError.message);
    }

    return res.sendStatus(200);
  }),
);

export default router;
