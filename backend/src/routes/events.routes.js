import { Router } from "express";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import multer from "multer";
import { auditLogger } from "../middlewares/audit.middleware.js";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // MANUAL STEP: To track individual event views, create a Supabase DB function:
    //   increment_views(row_id uuid, table_name text) — UPDATE SET views = views + 1
    // Then call supabase.rpc('increment_views', { row_id, table_name: 'events' }) per item.
    const table = anonSupabase.from("events");
    const bucket = anonSupabase.storage.from("events");

    const { data: bucketData, error: bucketError } = await bucket.list();
    if (bucketError) throw new Error(bucketError.message);

    const imageMap = Object.fromEntries(
      await Promise.all(
        bucketData.map(async (folder) => {
          const { data: files } = await bucket.list(folder.name);

          const links = files.map((file) => {
            const path = `${folder.name}/${file.name}`;
            return bucket.getPublicUrl(path).data.publicUrl;
          });

          return [folder.name, links];
        }),
      ),
    );

    const { data, error } = await table.select();
    if (error) throw new Error(error.message);

    const payload = data.map((d, i) => {
      return {
        id: d.id,
        created_at: d.created_at,
        name: d.name,
        description: d.description,
        date: d.date_happened,
        images: imageMap[d.id],
      };
    });

    return res.json(payload);
  }),
);

router.post(
  "/add",
  upload.array("images", 3),
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    const { name, description, date_happened } = req.body;
    const images = req.files;
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .upsert(
        { name, description, date_happened, ip_address, user_agent },
        { onConflict: "name" },
      )
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

    return res.sendStatus(200);
  }),
);

router.post(
  "/edit",
  upload.fields([
    { name: "image_0", maxCount: 1 },
    { name: "image_1", maxCount: 1 },
    { name: "image_2", maxCount: 1 },
  ]),
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    const { id, name, description, date } = req.body;
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");

    const { error } = await supabase
      .from("events")
      .update({ name, description, date_happened: date })
      .eq("id", id);
    if (error) throw new Error(error.message);

    // Replace only the image slots that were supplied in this request
    for (let i = 0; i <= 2; i++) {
      const slotFiles = req.files?.[`image_${i}`];
      if (slotFiles && slotFiles.length > 0) {
        const file = slotFiles[0];
        const { error: uploadError } = await eventBucket.upload(
          `${id}/${i}.jpg`,
          file.buffer,
          { contentType: file.mimetype, upsert: true },
        );
        if (uploadError) throw new ApiError(500, uploadError.message);
      }
    }

    return res.sendStatus(200);
  }),
);

router.delete(
  "/delete",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    const token = req.token;
    const supabase = createUserClient(token);
    const table = supabase.from("events");
    const bucket = supabase.storage.from("events");

    // Delete table entry
    const { error } = await table.delete().eq("id", id);
    if (error) throw new Error(error.message);

    // Delete images
    const { data: files, error: bucketError } = await bucket.list(`${id}/`);
    if (bucketError) throw new Error(bucketError.message);

    const paths = files.map((file) => `${id}/${file.name}`);

    const { error: deleteError } = await bucket.remove(paths);
    if (deleteError) throw new Error(deleteError.message);

    return res.sendStatus(200);
  }),
);

export default router;