import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import {
  requireAuth,
  requireSuperAdmin,
} from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";
import { validate } from "../middlewares/validate.middleware.js";
import { auditLogger } from "../middlewares/audit.middleware.js";
import { invalidateCachePrefix } from "../lib/cache.js";
import { invalidateActiveTerm } from "../lib/activeTerm.js";
import { termCreateSchema, termActivateSchema } from "../schemas/index.js";

const router = Router();

// ── Read ────────────────────────────────────────────────────────────────────
// Any authenticated admin may view the term list (the active term drives content
// they create). Only super-admins may create/activate/archive (gated below).

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("terms")
      .select("id, label, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data ?? []);
  }),
);

// ── Create ──────────────────────────────────────────────────────────────────

router.post(
  "/",
  requireAuth,
  requireSuperAdmin,
  validate(termCreateSchema),
  auditLogger("term:create"),
  asyncHandler(async (req, res) => {
    const { label } = req.body;

    const { data, error } = await supabase
      .from("terms")
      .insert({ label, status: "archived" })
      .select("id, label, status, created_at")
      .single();

    if (error) {
      // Unique violation on the label — surface a clean 400 instead of a 500.
      if (error.code === "23505")
        throw new ApiError(400, `Term "${label}" already exists.`);
      throw new ApiError(500, error.message);
    }

    return res.status(201).json(data);
  }),
);

// ── Activate (rollover) ───────────────────────────────────────────────────────
// Flips the active term and auto-archives the outgoing officer roster, stamping
// each archived officer with the term they served (the OUTGOING label).

router.post(
  "/activate",
  requireAuth,
  requireSuperAdmin,
  validate(termActivateSchema),
  auditLogger("term:activate"),
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    // Target must exist.
    const { data: target, error: targetErr } = await supabase
      .from("terms")
      .select("id, label, status")
      .eq("id", id)
      .single();
    if (targetErr || !target) throw new ApiError(404, "Term not found.");
    if (target.status === "active")
      throw new ApiError(400, "That term is already active.");

    // Capture the outgoing active term's label so archived officers are stamped
    // with the term they actually served (not the incoming one).
    const { data: current } = await supabase
      .from("terms")
      .select("label")
      .eq("status", "active")
      .maybeSingle();
    const outgoingLabel = current?.label ?? null;

    // 1. Demote the currently active term.
    {
      const { error } = await supabase
        .from("terms")
        .update({ status: "archived" })
        .eq("status", "active");
      if (error) throw new ApiError(500, error.message);
    }

    // 2. Promote the target.
    {
      const { error } = await supabase
        .from("terms")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw new ApiError(500, error.message);
    }

    // 3. Keep the denormalized pointer in sync and drop its cache.
    {
      const { error } = await supabase
        .from("settings")
        .upsert(
          { key: "active_term", value: target.label },
          { onConflict: "key" },
        );
      if (error) throw new ApiError(500, error.message);
    }
    invalidateActiveTerm();

    // 4. Auto-archive the current officer roster, stamping the outgoing term.
    //    Mirrors the end-of-term archive flow in officers.routes.js.
    let archivedCount = 0;
    {
      const { data: archived, error } = await supabase
        .from("officers")
        .update({ status: "archived", term_year: outgoingLabel })
        .eq("status", "active")
        .is("deleted_at", null)
        .select("id");
      if (error) throw new ApiError(500, error.message);
      archivedCount = archived?.length ?? 0;
    }
    invalidateCachePrefix("officers:");

    return res.status(200).json({
      message: `Term "${target.label}" is now active.`,
      activeTerm: target.label,
      officersArchived: archivedCount,
    });
  }),
);

// ── Archive ───────────────────────────────────────────────────────────────────

router.post(
  "/archive",
  requireAuth,
  requireSuperAdmin,
  validate(termActivateSchema),
  auditLogger("term:archive"),
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    const { data: target, error: targetErr } = await supabase
      .from("terms")
      .select("id, status")
      .eq("id", id)
      .single();
    if (targetErr || !target) throw new ApiError(404, "Term not found.");
    if (target.status === "active")
      throw new ApiError(400, "Cannot archive the active term. Activate another term first.");

    const { error } = await supabase
      .from("terms")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) throw new ApiError(500, error.message);

    return res.status(200).json({ message: "Term archived." });
  }),
);

export default router;
