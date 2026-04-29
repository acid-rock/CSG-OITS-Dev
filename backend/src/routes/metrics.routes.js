import { Router } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import cors from "cors";

const router = Router();

// GET metric data
router.get(
  "/page-views",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.rpc("get_monthly_visits");
    if (error) throw new ApiError(500, "Failed to fetch metric data.");
    res.json(data);
  }),
);

// INSERT new metric data
router.post(
  "/page-track",
  cors({
    origin: "http://localhost:5173", // TODO: Change to FRONTEND_URL when in production.
    methods: ["POST"],
  }),
  asyncHandler(async (req, res) => {
    if (!req.body) throw new ApiError(400, "No valid request body is found.");
    const { path } = req.body;
    const { error } = await supabase.from("page_views").insert({ path });
    if (error) throw new ApiError(500, "Failed to insert metric data.");
    res.status(201).json({ message: "Metric data inserted successfully." });
  }),
);

// GET all files
router.get(
  "/file-sizes",
  asyncHandler(async (req, res) => {
    async function getFolderSize(bucketName, folderPath) {
      let totalSize = 0;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath);

      if (!data) return 0;

      for (const item of data) {
        if (item.name === ".emptyFolderPlaceholder") continue;
        
        if (item.id) {
          // It's a file
          totalSize += item.metadata?.size || 0;
        } else {
          // It's a folder, recurse
          const folderPath_ = folderPath ? `${folderPath}/${item.name}` : item.name;
          totalSize += await getFolderSize(bucketName, folderPath_);
        }
      }
      return totalSize;
    }

    const returnedData = [];
    const bucketNames = ["documents", "events", "bulletin"];

    for (const bucketName of bucketNames) {
      let totalSize = 0;
      
      if (bucketName === "documents") {
        const categories = [
          "accomplishment-report",
          "activity-proposal",
          "archive",
          "excuse-letter",
          "minutes-of-the-meeting",
          "office-memorandum",
          "project-proposal",
          "resolution",
          "sponsorship-letter",
        ];
        for (const category of categories) {
          totalSize += await getFolderSize(bucketName, category);
        }
      } else {
        totalSize = await getFolderSize(bucketName, "");
      }

      returnedData.push({
        bucket: bucketName,
        totalSize,
      });
    }

    return res.status(200).json(returnedData);
  }),
);

export default router;
