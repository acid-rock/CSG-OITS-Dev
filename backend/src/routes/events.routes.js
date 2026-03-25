import { Router } from "express";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data: eventData, error: eventDataError } = await anonSupabase
      .from("events")
      .select();
    if (eventDataError) throw new Error(eventDataError.message);

    const payload = await Promise.all(
      eventData.map(async (folder) => {
        const { data: filenames } = await anonSupabase.storage
          .from("events")
          .list(folder.img_dir);

        const images = filenames.map((file) => {
          return anonSupabase.storage
            .from("events")
            .getPublicUrl(`${folder.img_dir}/${file.name}`).data.publicUrl;
        });

        return {
          id: folder.id,
          name: folder.name,
          date: folder.date,
          description: folder.description,
          folder: folder.img_dir,
          images: images,
        };
      }),
    );

    return res.status(200).json(payload);
  }),
);

router.post(
  "/add",
  upload.array("images", 3),
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const images = req.files;
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");

    // NOTE TO SELF: Add date-happened.
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .upsert({ name, description }, { onConflict: "name" })
      .select();
    if (eventError) throw new Error(eventError.message);

    for (let i = 0; i < images.length; i++) {
      const filename = `${eventData[0].id}/${i}.jpg`;
      const buffer = images[i].buffer;

      const { data, error } = await eventBucket.upload(filename, buffer, {
        contentType: images[i].mimetype,
      });
      if (error) throw new Error(error.message);
    }

    return res.send(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id, name, description } = req.body;
    const token = req.token;
    const supabase = createUserClient(token);

    const { data, error } = await supabase
      .from("events")
      .update({ name, description })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }),
);

router.delete("/delete", requireAuth, asyncHandler());

export default router;
