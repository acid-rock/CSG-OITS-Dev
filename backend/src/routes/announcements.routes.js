import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { auditLogger } from "../middlewares/audit.middleware.js";
import ApiError from "../lib/apiError.js";

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
        is_archived: row.is_archived || false,
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
    const id = crypto.randomUUID();
    const token = req.token;
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];
    const imgPath = `${id}.jpg`;
    const { title, content } = req.body;
    const file = req.file ? req.file : null;

    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase
      .from("bulletin")
      .upsert(
        {
          id: id,
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

    if (file) {
      const { data: imgData, error: uploadError } = await userSupabase.storage
        .from("bulletin")
        .upload(imgPath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);
    }

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

router.post(
  "/archive",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");

    const ids = req.body.ids ? req.body.ids : [];
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Move the image to the "archived" folder in storage
    for (const id of ids) {
      const imgPath = `${id}.jpg`;
      const newPath = `archive/${imgPath}`;

      const { error: moveError } = await userSupabase.storage
        .from("bulletin")
        .move(imgPath, newPath);
      if (moveError) throw new Error(moveError.message);

      // Update path in the database as well
      const { error: updateError } = await userSupabase
        .from("bulletin")
        .update({ image: newPath })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
    }

    // Update is_archived to true
    const { error } = await userSupabase
      .from("bulletin")
      .update({ is_archived: true })
      .in("id", ids);
    if (error) throw new Error(error.message);

    return res.send(200);
  }),
);

router.post(
  "/unarchive",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");

    const ids = req.body.ids ? req.body.ids : [];
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Move the image back to the active folder in storage
    for (const id of ids) {
      const imgPath = `${id}.jpg`;
      const archivedPath = `archive/${imgPath}`;

      const { error: moveError } = await userSupabase.storage
        .from("bulletin")
        .move(archivedPath, imgPath);
      if (moveError) throw new Error(moveError.message);

      // Update path in the database as well
      const { error: updateError } = await userSupabase
        .from("bulletin")
        .update({ image: imgPath })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
    }

    // Update is_archived to false
    const { error } = await userSupabase
      .from("bulletin")
      .update({ is_archived: false })
      .in("id", ids);
    if (error) throw new Error(error.message);

    return res.send(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");
    const ids = req.body;
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Delete the image associated with the announcement
    for (const id of ids) {
      const imgPath = `${id}.jpg`;
      const { error: deleteError } = await userSupabase.storage
        .from("bulletin")
        .remove([imgPath]);
      if (deleteError) throw new Error(deleteError.message);

      // Delete the announcement from the database
      const { error } = await userSupabase
        .from("bulletin")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

    return res.send(200);
  }),
);

export default router;
