import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await anonSupabase
      .from("committees")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);
    return res.status(200).json(data);
  }),
);

export default router;
