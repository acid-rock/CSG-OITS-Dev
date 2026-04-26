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
        is_archived: d.is_archived || false,
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
    const imageTable = supabase.from("event_images");
    const eventBucket = supabase.storage.from("events");
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];

    // Insert event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({ name, description, date_happened })
      .select()
      .single();
    if (eventError) throw new Error(eventError.message);

    // Insert images to table
    const imageList = images.map((img) => {
      const imageId = crypto.randomUUID();
      const path = `${eventData.id}/${imageId}`;

      return {
        id: imageId,
        event_id: eventData.id,
        path: path,
        size: img.size,
        mimetype: img.mimetype,
        image: img.buffer,
      };
    });

    const { data: insertData, error: insertError } = await imageTable
      .insert(imageList.map(({ image, ...rest }) => rest))
      .select();
    if (insertError) throw new Error(insertError.message);

    // Upload images to bucket
    const { error: bucketError } = await Promise.all(
      images.map(async (img, i) => {
        const { error } = await eventBucket.upload(
          imageList[i].path,
          img.buffer,
          {
            contentType: img.mimetype,
          },
        );
        return error;
      }),
    );
    if (bucketError) throw new Error(bucketError.message);

    return res.send(200);
  }),
);

router.post(
  "/edit",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
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
    const token = req.token;
    const userSupabase = createUserClient(token);
    const eventTable = userSupabase.from("events");
    const eventImageTable = userSupabase.from("event_images");
    const bucket = userSupabase.storage.from("events");

    // Support both single ID and array of IDs for deletion
    const ids = Array.isArray(req.body) ? req.body : [req.body];

    // Select entries to delete
    const { data: events, error: fetchError } = await eventTable
      .select()
      .in("id", ids);
    if (fetchError) throw new Error(fetchError.message);

    const { data: images, error: imageError } = await eventImageTable
      .select()
      .in("event_id", ids);
    if (imageError) throw new Error(imageError.message);
    console.log(images);
    const filepaths = images.map((image) => image.path);

    // Delete images from bucket
    const { error: bucketError } = await Promise.all(
      filepaths.map(async (path) => {
        const { error } = await bucket.remove(path);
        return error;
      }),
    );
    if (bucketError) throw new Error(bucketError.message);

    // Delete entries from event table. CASCADE should handle event_images
    const { error: deleteError } = await eventTable.delete().in("id", ids);
    if (deleteError) throw new Error(deleteError.message);

    return res.send(200);
  }),
);

router.post(
  "/archive",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (!req.body) throw new Error("No valid request body is found.");

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Select images to archive
    const bucket = userSupabase.storage.from("events");
    for (const id of ids) {
      const { data: images, error: imageError } = await userSupabase
        .from("event_images")
        .select("*")
        .eq("event_id", id);
      if (imageError) throw new Error(imageError.message);

      // Move each image to archived folder
      for (const image of images) {
        const { error } = await bucket.move(
          image.path,
          `archive/${image.path}`,
        );
        if (error) throw new Error(error.message);

        // Update the image table entries to reflect new paths
        const { error: updateError } = await userSupabase
          .from("event_images")
          .update({ path: `archive/${image.path}` })
          .eq("event_id", id);
        if (updateError) throw new Error(updateError.message);
      }
    }

    // Update every entry's archived flag to true
    const { error: updateError } = await userSupabase
      .from("events")
      .update({ is_archived: true })
      .in("id", ids);
    if (updateError) throw new Error(updateError.message);

    return res.send(200);
  }),
);

router.post(
  "/unarchive",
  requireAuth,
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (!req.body) throw new Error("No valid request body is found.");

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    const token = req.token;
    const userSupabase = createUserClient(token);

    // Select images to unarchive
    const bucket = userSupabase.storage.from("events");
    for (const id of ids) {
      const { data: images, error: imageError } = await userSupabase
        .from("event_images")
        .select("*")
        .eq("event_id", id);
      if (imageError) throw new Error(imageError.message);

      // Move each image back to the main folder
      for (const image of images) {
        const { error } = await bucket.move(
          `${image.path}`,
          image.path.replace("archive/", ""),
        );
        if (error) throw new Error(error.message);

        // Update the image table entries to reflect new paths
        const { error: updateError } = await userSupabase
          .from("event_images")
          .update({ path: image.path.replace("archive/", "") })
          .eq("event_id", id);
        if (updateError) throw new Error(updateError.message);
      }
    }

    // Update every entry's archived flag to false
    const { error: updateError } = await userSupabase
      .from("events")
      .update({ is_archived: false })
      .in("id", ids);
    if (updateError) throw new Error(updateError.message);

    return res.send(200);
  }),
);

export default router;
