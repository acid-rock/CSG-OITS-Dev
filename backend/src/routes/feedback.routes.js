/**
 * feedback.routes.js — Site Feedback
 *
 * Public:
 *   POST /           — Submit feedback (no auth required)
 *
 * Admin (requireAuth):
 *   GET  /           — List all feedback entries, newest first
 *   PATCH /status    — Update a feedback entry's status (new → read → resolved)
 *   DELETE /delete   — Hard-delete one or more entries
 */

import express from "express";
import asyncHandler from "express-async-handler";
import { supabase } from "../lib/supabaseClient.js";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  feedbackSubmitSchema,
  feedbackUpdateSchema,
  feedbackDeleteSchema,
} from "../schemas/index.js";

const router = express.Router();

// ── POST / — public feedback submission ──────────────────────────────────────
router.post(
  "/",
  validate(feedbackSubmitSchema),
  asyncHandler(async (req, res) => {
    const { type, message, name, email } = req.body;

    const { data, error } = await supabase
      .from("site_feedback")
      .insert({
        type,
        message,
        name:  name  || null,
        email: email || null,
      })
      .select("id")
      .single();

    if (error) throw new ApiError(500, error.message);

    return res.status(201).json({ message: "Feedback submitted. Thank you!", id: data.id });
  }),
);

// ── GET / — admin: list all feedback ─────────────────────────────────────────
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("site_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);

    return res.json(data);
  }),
);

// ── PATCH /status — admin: mark feedback as read or resolved ─────────────────
router.patch(
  "/status",
  requireAuth,
  validate(feedbackUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id, status } = req.body;

    const { data, error } = await supabase
      .from("site_feedback")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    if (!data)  throw new ApiError(404, "Feedback entry not found.");

    return res.json(data);
  }),
);

// ── DELETE /delete — admin: hard delete ──────────────────────────────────────
router.delete(
  "/delete",
  requireAuth,
  validate(feedbackDeleteSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;

    const { error } = await supabase
      .from("site_feedback")
      .delete()
      .in("id", ids);

    if (error) throw new ApiError(500, error.message);

    return res.json({ message: `Deleted ${ids.length} feedback item(s).` });
  }),
);

export default router;
