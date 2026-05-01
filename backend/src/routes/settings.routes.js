import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";

const router = Router();

// TABLE NAME UNVERIFIED — confirm 'settings' exists in Supabase dashboard
// Expected columns: id (primary key), system_name (text), logo_url (text), access_paused (boolean)

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return res.status(200).json({
        system_name: "CSG-OITS",
        logo_url: null,
        access_paused: false,
      });
    }

    return res.status(200).json(data);
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { system_name, logo_url, access_paused } = req.body;

    if (!system_name) throw new ApiError(400, "System name is required.");

    const { error } = await supabase
      .from("settings")
      .upsert({ system_name, logo_url, access_paused }, { onConflict: "id" });

    if (error) throw new Error(error.message);

    return res.sendStatus(200);
  }),
);

export default router;
