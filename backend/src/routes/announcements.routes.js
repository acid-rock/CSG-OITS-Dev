import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { anonSupabase, createUserClient } from "../lib/supabaseClient.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", async (req, res) => {
  let { data, error } = await anonSupabase.from("bulletin").select();
  if (error) return res.status(400).json({ message: error.message });

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
});

router.post("/add", requireAuth, upload.single("image"), async (req, res) => {
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

  if (error) return res.status(400).json({ message: error.message });

  const imgPath = `${data[0].id}.jpg`;
  const { data: imgData, error: uploadError } = await userSupabase.storage
    .from("bulletin")
    .upload(imgPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError)
    return res.status(400).json({ message: uploadError.message });

  return res.send(200);
});

router.post("/edit", requireAuth, async (req, res) => {
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
  if (error) return res.status(400).json({ message: error.message });

  return res.send(200);
});

router.delete("/delete", requireAuth, async (req, res) => {
  const token = req.token;
  const userSupabase = createUserClient(token);

  for (const item of req.body) {
    const imgPath = `${item.id}.jpg`;
    const { error } = await userSupabase
      .from("bulletin")
      .delete()
      .eq("id", item.id);
    if (error) return res.status(400).json({ message: error.message });

    const { data, error: deleteImgError } = await userSupabase.storage
      .from("bulletin")
      .remove([imgPath]);
    if (deleteImgError)
      return res.status(400).json({ message: deleteImgError.message });
  }

  return res.send(200);
});

export default router;
