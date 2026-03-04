import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await anonSupabase
    .from("committees")
    .select("*")
    .order("id", { ascending: true });
  if (error) return res.status(400).json({ message: error.message });
  return res.status(200).json(data);
});

export default router;
