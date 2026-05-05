import { Router } from "express";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { supabase } from "../lib/supabaseClient.js";

const router = Router();

const BUCKETS = ["bulletin", "documents", "thumbnails", "events", "officers"];

// Lists all files in a bucket up to two directory levels deep and sums their sizes.
const getBucketSize = async (bucket) => {
  try {
    const { data: topLevel } = await supabase.storage.from(bucket).list("", { limit: 1000 });
    if (!topLevel) return 0;

    let total = 0;
    for (const item of topLevel) {
      if (item.metadata) {
        total += item.metadata.size ?? 0;
      } else {
        // Virtual folder — list one level deeper
        const { data: sub } = await supabase.storage.from(bucket).list(item.name, { limit: 1000 });
        if (sub) {
          total += sub.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
};

router.get(
  "/storage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stats = await Promise.all(
      BUCKETS.map(async (bucket) => ({
        name: bucket,
        size: await getBucketSize(bucket),
      })),
    );
    return res.status(200).json(stats);
  }),
);

export default router;
