// MANUAL STEP (run in Supabase SQL editor before deploying):
//
//   ALTER TABLE committees ADD COLUMN IF NOT EXISTS duty_pin TEXT;
//
//   CREATE TABLE IF NOT EXISTS office_duties (
//     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     committee_id  UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
//     duty_date     DATE NOT NULL,
//     notes         TEXT,
//     created_at    TIMESTAMPTZ DEFAULT now(),
//     UNIQUE (committee_id, duty_date)
//   );
//
//   CREATE INDEX IF NOT EXISTS idx_office_duties_date      ON office_duties (duty_date);
//   CREATE INDEX IF NOT EXISTS idx_office_duties_committee ON office_duties (committee_id);

import { Router } from "express";
import { anonSupabase, supabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import { validate } from "../middlewares/validate.middleware.js";
import { invalidateCachePrefix } from "../lib/cache.js";
import { checkinDutySchema, checkoutDutySchema } from "../schemas/index.js";

const router = Router();

// ── Shared helper ─────────────────────────────────────────────────────────────
/** Resolve a committee's cover image path to a public URL. */
const getCoverUrl = (path) => {
  if (!path) return null;
  return anonSupabase.storage.from("committees").getPublicUrl(path).data.publicUrl;
};

/** Enrich raw duty rows with resolved cover_image_url. */
const enrichRows = (rows) =>
  (rows ?? []).map((row) => {
    const c = row.committees;
    if (!c) return row;
    const cover_image_url = getCoverUrl(c.cover_image_path ?? null);
    return { ...row, committees: { ...c, cover_image_url } };
  });

/**
 * Inline committee duty-PIN verifier.
 * Uses service key (supabase) so the duty_pin column — excluded from
 * the public select — is still readable here.
 *
 * Throws ApiError on any auth failure; returns the committee row on success.
 */
async function verifyDutyPin(committee_id, duty_pin) {
  const { data, error } = await supabase
    .from("committees")
    .select("id, name, duty_pin")
    .eq("id", committee_id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new ApiError(404, "Committee not found.");
  if (!data.duty_pin) throw new ApiError(403, "No duty PIN set for this committee. Contact an admin.");
  if (data.duty_pin !== duty_pin.trim()) throw new ApiError(401, "Incorrect duty PIN.");
  return data;
}

// ── GET / — public: list duties ───────────────────────────────────────────────
// Query params (at least one required):
//   ?date=YYYY-MM-DD          single day
//   ?month=YYYY-MM            whole calendar month
//   &committee_id=UUID        optional filter by committee (combinable)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { date, month, committee_id } = req.query;

    if (!date && !month) {
      throw new ApiError(400, "Provide either ?date=YYYY-MM-DD or ?month=YYYY-MM.");
    }

    let query = anonSupabase
      .from("office_duties")
      .select(
        "id, duty_date, notes, created_at, committee_id, committees ( id, name, chair_name, cover_image_path )",
      )
      .order("duty_date", { ascending: true });

    if (date) {
      query = query.eq("duty_date", date);
    } else if (month) {
      // month = "YYYY-MM" → first and last day of that month
      const [y, m] = month.split("-").map(Number);
      if (!y || !m || m < 1 || m > 12) throw new ApiError(400, "Invalid month format.");
      const start = `${month}-01`;
      const end   = new Date(y, m, 0).toISOString().split("T")[0]; // last day
      query = query.gte("duty_date", start).lte("duty_date", end);
    }

    if (committee_id) query = query.eq("committee_id", committee_id);

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    return res.status(200).json(enrichRows(data));
  }),
);

// ── POST /checkin — committee PIN auth: file a duty date ─────────────────────
router.post(
  "/checkin",
  validate(checkinDutySchema),
  asyncHandler(async (req, res) => {
    const { committee_id, duty_date, notes, duty_pin } = req.body;

    await verifyDutyPin(committee_id, duty_pin);

    const { data, error } = await supabase
      .from("office_duties")
      .insert({ committee_id, duty_date, notes: notes ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "This committee is already filed for that date.");
      }
      throw new ApiError(500, error.message);
    }

    invalidateCachePrefix("office-duties:");
    return res.status(201).json(data);
  }),
);

// ── DELETE /checkout — committee PIN auth: remove a duty date ─────────────────
router.delete(
  "/checkout",
  validate(checkoutDutySchema),
  asyncHandler(async (req, res) => {
    const { committee_id, duty_date, duty_pin } = req.body;

    await verifyDutyPin(committee_id, duty_pin);

    const { error } = await supabase
      .from("office_duties")
      .delete()
      .eq("committee_id", committee_id)
      .eq("duty_date", duty_date);

    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("office-duties:");
    return res.sendStatus(200);
  }),
);

// ── POST /admin/add — admin bypass (no PIN required) ─────────────────────────
router.post(
  "/admin/add",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { committee_id, duty_date, notes } = req.body;
    if (!committee_id || typeof committee_id !== "string") throw new ApiError(400, "committee_id is required.");
    if (!duty_date || !/^\d{4}-\d{2}-\d{2}$/.test(duty_date)) throw new ApiError(400, "duty_date must be YYYY-MM-DD.");

    const { data, error } = await supabase
      .from("office_duties")
      .insert({ committee_id, duty_date, notes: notes ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "This committee is already filed for that date.");
      }
      throw new ApiError(500, error.message);
    }

    invalidateCachePrefix("office-duties:");
    return res.status(201).json(data);
  }),
);

// ── DELETE /admin/delete — admin hard-delete by id ───────────────────────────
router.delete(
  "/admin/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id || typeof id !== "string") throw new ApiError(400, "id is required.");

    const { error } = await supabase
      .from("office_duties")
      .delete()
      .eq("id", id);

    if (error) throw new ApiError(500, error.message);
    invalidateCachePrefix("office-duties:");
    return res.sendStatus(200);
  }),
);

// ── GET /admin — admin: all duties, paginated ────────────────────────────────
// Query params: ?month=YYYY-MM, &page=1, &limit=50
router.get(
  "/admin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { month, page = "1", limit = "50" } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset   = (pageNum - 1) * limitNum;

    let query = supabase
      .from("office_duties")
      .select(
        "id, duty_date, notes, created_at, committee_id, committees ( id, name, chair_name, cover_image_path )",
        { count: "exact" },
      )
      .order("duty_date", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (y && m >= 1 && m <= 12) {
        const start = `${month}-01`;
        const end   = new Date(y, m, 0).toISOString().split("T")[0];
        query = query.gte("duty_date", start).lte("duty_date", end);
      }
    }

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, error.message);

    // Resolve cover_image_url using service key client's storage (admin context)
    const resolved = (data ?? []).map((row) => {
      const c = row.committees;
      if (!c) return row;
      const cover_image_url = c.cover_image_path
        ? supabase.storage.from("committees").getPublicUrl(c.cover_image_path).data.publicUrl
        : null;
      return { ...row, committees: { ...c, cover_image_url } };
    });

    return res.status(200).json({
      data: resolved,
      total: count ?? 0,
      page: pageNum,
      limit: limitNum,
    });
  }),
);

export default router;
