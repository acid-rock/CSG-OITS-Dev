import { Router } from "express";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { auditLogger } from "../middlewares/audit.middleware.js";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get(
  "/",
  asyncHandler(async (req, res) => {
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
    const { name, description } = req.body;
    const images = req.files;
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];

    // NOTE TO SELF: Add date-happened.
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .upsert(
        { name, description, ip_address, user_agent },
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

    return res.send(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    console.log(req.headers);
    const { id, name, description, date } = req.body;
    const token = req.token;
    const supabase = createUserClient(token);

    const { data, error } = await supabase
      .from("events")
      .update({ name, description, date_happened: date })
      .eq("id", id);
    if (error) throw new Error(error.message);

    return res.send(200);
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

    return res.send(200);
  }),
);

export default router;