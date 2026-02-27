import { Router } from "express";
import axios from "axios";
import { createUserClient, supabase } from "../lib/supabaseClient.js";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import FormData from "form-data";
import "dotenv/config";

const REDACT_URL = process.env.PDF_REDACT_URL || "";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = Router();

// GET all documents and thumbnails
router.get("/", async (req, res) => {
  const { data: files } = await supabase.from("documents").select("*");

  const filepaths = files.map((file) => {
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(file.file_path);

    const thumbnail = supabase.storage
      .from("thumbnails")
      .getPublicUrl(`${file.id}.png`).data.publicUrl;

    return {
      id: file.id,
      name: file.file_path,
      description: file.description,
      category: file.file_path.split("/")[0],
      url: data.publicUrl,
      thumbnail: thumbnail,
    };
  });

  return res.status(200).json(filepaths);
});

router.post("/add", upload.single("file"), requireAuth, async (req, res) => {
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

  if (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }

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

  if (thumbnailError)
    return res.status(400).json({ message: thumbnailError.message });

  const { error: tableError } = await userSupabase.from("documents").upsert(
    {
      id: data.id,
      file_path: filepath,
      description: description,
      owner_id: req.user.sub,
    },
    { onConflict: "id" },
  );

  if (tableError) {
    console.error(tableError);
    return res.status(400).json({ message: tableError.message });
  }

  return res.send(200);
});

router.post("/edit", requireAuth, async (req, res) => {
  const token = req.token;
  const { name, description, type, id, file } = req.body;
  const filepath = `${type}/${name}.pdf`;

  const userSupabase = createUserClient(token);
  const { data: oldFile, error: fetchError } = await userSupabase
    .from("documents")
    .select()
    .eq("id", id);

  if (fetchError) return res.status(400).json({ message: fetchError.message });

  const { error: updateError } = await userSupabase
    .from("documents")
    .update({
      file_path: filepath,
      description: description,
    })
    .eq("id", id);

  if (updateError)
    return res.status(400).json({ message: updateError.message });

  const { error: copyError } = await userSupabase.storage
    .from("documents")
    .copy(oldFile[0].file_path, filepath);
  const { error: deleteError } = await userSupabase.storage
    .from("documents")
    .remove([oldFile[0].file_path]);

  if (copyError) return res.status(400).json({ message: copyError.message });
  if (deleteError)
    return res.status(400).json({ message: deleteError.message });

  if (error) return res.status(400).json({ message: error.message });

  return res.sendStatus(200);
});

router.delete("/delete", requireAuth, async (req, res) => {
  if (!req.body)
    return res.status(400).json({ message: "No request body is found." });

  const token = req.token;
  const userSupabase = createUserClient(token);
  const filepaths = req.body.map((item) => {
    return item.name;
  });

  for (const document of req.body) {
    const { error: deleteRowError } = await userSupabase
      .from("documents")
      .delete()
      .eq("id", document.id);
    if (deleteRowError)
      return res.status(400).json({ message: deleteRowError.message });

    const { error: deleteFileError } = await userSupabase.storage
      .from("documents")
      .remove(filepaths);

    if (deleteFileError)
      return res.status(400).json({ message: deleteFileError.message });
  }

  return res.send(200);
});

export default router;
