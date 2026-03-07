import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";

const router = Router();

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

export default router;
