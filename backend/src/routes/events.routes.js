import { Router } from "express";
import { anonSupabase, supabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import multer from "multer";
import { auditLogger } from "../middlewares/audit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addEventSchema,
  editEventSchema,
  singleIdSchema,
  deleteIdsSchema,
} from "../schemas/index.js";
import { validateImageUpload } from "../lib/uploadValidation.js";
import { sanitizeContent } from "../lib/sanitize.js";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

// MANUAL STEP: ALTER TABLE events ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
// MANUAL STEP: ALTER TABLE events ADD COLUMN IF NOT EXISTS archived_at timestamptz;

// MANUAL STEP (Bug 4 / CDN cache): In Supabase dashboard, add to events table:
//   updated_at timestamptz DEFAULT now()
// Then create a trigger to auto-update it:
//   CREATE OR REPLACE FUNCTION set_updated_at()
//     RETURNS trigger LANGUAGE plpgsql AS
//     $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
//   CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
//     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
// Once that column exists, replace Date.now() below with d.updated_at unix timestamp.
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

    // Bug 4 workaround: each response carries a fresh cache-bust value so that
    // browsers do not serve a stale CDN-cached version after an image replacement.
    // Replace Date.now() with the event's updated_at unix timestamp once that
    // column exists (see MANUAL STEP above).
    const cacheV = Date.now();

    const imageMap = Object.fromEntries(
      await Promise.all(
        bucketData.map(async (folder) => {
          const { data: files } = await bucket.list(folder.name);

          // Bug 3 fix: Supabase Storage may include a hidden .emptyFolderPlaceholder
          // file. Filter it out and sort remaining files numerically so that
          // 0.jpg is always index 0, regardless of storage listing order.
          const links = files
            .filter((file) => !file.name.startsWith("."))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
            .map((file) => {
              const path = `${folder.name}/${file.name}`;
              return `${bucket.getPublicUrl(path).data.publicUrl}?v=${cacheV}`;
            });

          return [folder.name, links];
        }),
      ),
    );

    const { data, error } = await table.select().eq("is_archived", false).is("deleted_at", null);
    if (error) throw new Error(error.message);

    const payload = data.map((d) => {
      return {
        id: d.id,
        created_at: d.created_at,
        name: d.name,
        description: d.description,
        date: d.date_happened,
        images: imageMap[d.id] ?? [],
      };
    });

    return res.json(payload);
  }),
);

router.post(
  "/add",
  upload.array("images", 3),
  requireAuth,
  validate(addEventSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (req.files?.length) {
      for (const file of req.files) {
        validateImageUpload(file, false);
      }
    }
    const { name, description, date_happened } = req.body;
    const sanitizedDescription = sanitizeContent(description);
    const images = req.files;
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");
    const ip_address = req.ip;
    const user_agent = req.headers["user-agent"];

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .upsert(
        { name, description: sanitizedDescription, date_happened, ip_address, user_agent },
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
  validate(editEventSchema),
  auditLogger(),
  asyncHandler(async (req, res) => {
    if (req.files) {
      for (const slotFiles of Object.values(req.files)) {
        for (const file of slotFiles) {
          validateImageUpload(file, false);
        }
      }
    }
    const { id, name, description, date } = req.body;
    const sanitizedDescription = sanitizeContent(description);
    const token = req.token;
    const supabase = createUserClient(token);
    const eventBucket = supabase.storage.from("events");

    const { error } = await supabase
      .from("events")
      .update({ name, description: sanitizedDescription, date_happened: date })
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
  validate(singleIdSchema),
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

// ── Archive / Restore ─────────────────────────────────────────────────────────

router.get(
  "/archived",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bucket = anonSupabase.storage.from("events");
    const cacheV = Date.now();

    const { data: bucketData, error: bucketError } = await bucket.list();
    if (bucketError) throw new ApiError(500, bucketError.message);

    const imageMap = Object.fromEntries(
      await Promise.all(
        bucketData.map(async (folder) => {
          const { data: files } = await bucket.list(folder.name);
          const links = (files ?? [])
            .filter((file) => !file.name.startsWith("."))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
            .map((file) => {
              const path = `${folder.name}/${file.name}`;
              return `${bucket.getPublicUrl(path).data.publicUrl}?v=${cacheV}`;
            });
          return [folder.name, links];
        }),
      ),
    );

    const { data, error } = await supabase
      .from("events")
      .select()
      .eq("is_archived", true)
      .is("deleted_at", null)
      .order("archived_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);

    const payload = data.map((d) => ({
      id: d.id,
      created_at: d.created_at,
      name: d.name,
      description: d.description,
      date: d.date_happened,
      images: imageMap[d.id] ?? [],
      archived_at: d.archived_at,
    }));

    return res.json(payload);
  }),
);

router.get(
  "/bin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("events")
      .select()
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);

    const payload = data.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      date: d.date_happened,
      deleted_at: d.deleted_at,
    }));

    return res.json(payload);
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
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("events")
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
      .from("events")
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
      .from("events")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/restore-from-bin",
  requireAuth,
  validate(deleteIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids array is required.");
    }
    const { error } = await supabase
      .from("events")
      .update({ deleted_at: null, is_archived: false })
      .in("id", ids);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

export default router;
