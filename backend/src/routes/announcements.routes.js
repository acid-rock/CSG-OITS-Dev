import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { auditLogger } from "../middlewares/audit.middleware.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    let { data, error } = await anonSupabase.from("bulletin").select();
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
      };
    });

    return res.status(200).json(payload);
  }),
);

router.post(
  "/add",
  requireAuth,
  auditLogger(),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const token = req.token;
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];
    const imgPath = `${data[0].id}.jpg`;
    const { title, content } = req.body;

    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase
      .from("bulletin")
      .upsert(
        {
          title: title,
          content: content,
          owner_id: req.user.sub,
          image: imgPath,
          ip_address,
          user_agent,
        },
        { onConflict: "title" },
      )
      .select();

    if (error) throw new Error(error.message);

    const { data: imgData, error: uploadError } = await userSupabase.storage
      .from("bulletin")
      .upload(imgPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    return res.send(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");
    const { id, title, content, image } = req.body;
    const token = req.token;

    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("bulletin")
      .update({
        id,
        title,
        content,
        image,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.send(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);

    for (const id of req.body.id) {
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

    return res.send(200);
  }),
);

export default router;
