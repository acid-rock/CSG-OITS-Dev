import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";

const router = Router();

// GET /api/v1/equipment/ — returns all inventory rows, no auth required
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await anonSupabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data);
  }),
);

export default router;
