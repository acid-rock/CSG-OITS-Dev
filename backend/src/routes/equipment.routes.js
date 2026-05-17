import { Router } from "express";
import { anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { getCached, setCache } from "../lib/cache.js";

const router = Router();

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return anonSupabase.storage.from("equipment").getPublicUrl(imagePath).data.publicUrl;
};

// GET /api/v1/equipment/ — returns all inventory rows, no auth required
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const cacheKey = "equipment:all";
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    const { data, error } = await anonSupabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new ApiError(500, error.message);

    const transformed = data.map((item) => ({ ...item, image: resolveImageUrl(item.image) }));
    setCache(cacheKey, transformed, 60_000);
    return res.status(200).json(transformed);
  }),
);

export default router;
