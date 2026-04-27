import { Router } from "express";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { createUserClient } from "../lib/supabaseClient.js";
import { anonSupabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// GET all inventory items
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await anonSupabase.from("inventory").select("*");
    if (error) throw new ApiError(error.message);
    res.json(data);
  }),
);

// INSERT new inventory item
router.post(
  "/add",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const supabase = createUserClient(token);
    const { name, max_quantity } = req.body;
    const { data, error } = await supabase
      .from("inventory")
      .insert([{ name, max_quantity }]);
    if (error) throw new ApiError(error.message);
    res.sendStatus(201);
  }),
);

// UPDATE inventory item data
router.post(
  "/edit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const supabase = createUserClient(token);
    const { id, name, quantity, is_available } = req.body;
    const { data, error } = await supabase
      .from("inventory")
      .update({ name, quantity, is_available })
      .eq("id", id);
    if (error) throw new ApiError(error.message);
    res.sendStatus(200);
  }),
);

// DELETE inventory item(s)
router.delete(
  "/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const supabase = createUserClient(token);

    // Support deleting both single and multiple items
    const ids = Array.isArray(req.body) ? req.body : [req.body];
    console.log(ids);
    const { data, error } = await supabase
      .from("inventory")
      .delete()
      .in("id", ids);
    if (error) throw new ApiError(error.message);
    res.sendStatus(200);
  }),
);

export default router;
