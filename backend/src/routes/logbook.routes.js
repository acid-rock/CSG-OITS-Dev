/**
 * logbook.routes.js — Digital Office Logbook
 *
 * Officers scan a rotating QR code displayed in the CSG office, select their
 * name, and enter their student number to check in. Geolocation is validated
 * against the configured office coordinates. Sessions are automatically
 * closed at the start of each new day.
 *
 * Public endpoints (token/identity gated):
 *   GET  /qr-token            — Campus-IP gated; returns current token + TTL
 *   GET  /today               — Today's sessions (open + closed) with officer info
 *   GET  /status/:officer_id  — Current open session for one officer
 *   POST /checkin             — Token + student_number + geolocation check
 *   POST /checkout            — Close open session (no PIN; exit-QR intent)
 *
 * Admin endpoints (requireAuth):
 *   GET    /admin             — Paginated sessions by date/month/officer
 *   POST   /admin/checkout    — Force-close a session
 *   DELETE /admin/delete      — Hard-delete a session
 */

import express from "express";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import { supabase, anonSupabase } from "../lib/supabaseClient.js";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  logbookCheckinSchema,
  logbookCheckoutSchema,
  logbookAdminCheckoutSchema,
  logbookAdminDeleteSchema,
} from "../schemas/index.js";

const router = express.Router();

// ── Token helpers ─────────────────────────────────────────────────────────────

const SECRET = process.env.LOGBOOK_QR_SECRET ?? "";
const WINDOW = parseInt(process.env.LOGBOOK_TOKEN_WINDOW ?? "300", 10);

function makeToken(windowIndex) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(windowIndex))
    .digest("hex")
    .slice(0, 16);
}

function currentWindow() {
  return Math.floor(Date.now() / 1000 / WINDOW);
}

function isValidToken(token) {
  const w = currentWindow();
  return token === makeToken(w) || token === makeToken(w - 1);
}

// ── Geolocation helper ────────────────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Today's date in PH time (YYYY-MM-DD) ─────────────────────────────────────

function todayPH() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
}

// ── Auto-close stale open sessions (previous calendar days) ──────────────────

async function autoCloseStale(today) {
  await supabase
    .from("logbook_sessions")
    .update({
      check_out_at: new Date().toISOString(),
      auto_checkout: true,
    })
    .lt("date", today)
    .is("check_out_at", null);
}

// ── IP subnet check ───────────────────────────────────────────────────────────

async function assertCampusIp(req) {
  const cidr = process.env.CAMPUS_IP_CIDR;
  if (!cidr) return; // IP gating disabled if env not set
  try {
    const { isInSubnet } = await import("is-in-subnet");
    const ip =
      req.ip ??
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ??
      req.socket?.remoteAddress ??
      "";
    if (!isInSubnet(ip, cidr)) {
      throw new ApiError(
        403,
        "QR display is only accessible on the campus network."
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // If is-in-subnet throws for any reason, don't block — log and continue
    console.warn("[logbook] IP subnet check failed:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/logbook/qr-token
 * Returns the current time-window token for QR generation.
 * Restricted to campus network if CAMPUS_IP_CIDR is configured.
 */
router.get(
  "/qr-token",
  asyncHandler(async (req, res) => {
    await assertCampusIp(req);
    if (!SECRET) {
      throw new ApiError(500, "Logbook QR secret is not configured. Set LOGBOOK_QR_SECRET in .env.");
    }
    const w = currentWindow();
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresIn = WINDOW - (nowSec % WINDOW);
    return res.json({
      token: makeToken(w),
      expires_in: expiresIn,
      window_seconds: WINDOW,
    });
  })
);

/**
 * GET /api/v1/logbook/today
 * Returns all logbook sessions for today with officer info.
 * Side-effect: auto-closes stale open sessions from previous days.
 */
router.get(
  "/today",
  asyncHandler(async (req, res) => {
    const today = todayPH();
    await autoCloseStale(today);

    const { data: sessions, error } = await supabase
      .from("logbook_sessions")
      .select(
        `
        id, date, check_in_at, check_out_at, check_in_lat, check_in_lng, auto_checkout,
        officers ( id, full_name, position, avatar, committee )
      `
      )
      .eq("date", today)
      .order("check_in_at", { ascending: true });

    if (error) throw new ApiError(500, error.message);

    // Resolve officer avatars and fetch committee names
    const { data: committees } = await anonSupabase
      .from("committees")
      .select("id, name")
      .eq("status", "active")
      .is("deleted_at", null);

    const committeeMap = Object.fromEntries(
      (committees ?? []).map((c) => [c.id, c.name])
    );

    const transformed = (sessions ?? []).map((s) => {
      const officer = s.officers;
      const avatarUrl =
        officer?.avatar
          ? anonSupabase.storage
              .from("officers")
              .getPublicUrl(officer.avatar).data.publicUrl
          : null;
      return {
        id: s.id,
        date: s.date,
        check_in_at: s.check_in_at,
        check_out_at: s.check_out_at,
        check_in_lat: s.check_in_lat,
        check_in_lng: s.check_in_lng,
        auto_checkout: s.auto_checkout,
        officer: officer
          ? {
              id: officer.id,
              full_name: officer.full_name,
              position: officer.position,
              avatar_url: avatarUrl,
              committee_id: officer.committee,
              committee_name: officer.committee
                ? (committeeMap[officer.committee] ?? null)
                : null,
            }
          : null,
      };
    });

    return res.json(transformed);
  })
);

/**
 * GET /api/v1/logbook/status/:officer_id
 * Returns the current open session for an officer today, or null.
 */
router.get(
  "/status/:officer_id",
  asyncHandler(async (req, res) => {
    const { officer_id } = req.params;
    const today = todayPH();

    const { data, error } = await supabase
      .from("logbook_sessions")
      .select("id, date, check_in_at, check_out_at, auto_checkout")
      .eq("officer_id", officer_id)
      .eq("date", today)
      .is("check_out_at", null)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    return res.json({ open_session: data ?? null });
  })
);

/**
 * POST /api/v1/logbook/checkin
 * Body: { token, officer_id, student_number, lat?, lng? }
 * Validates token, student_number, geolocation, and open-session constraint.
 */
router.post(
  "/checkin",
  validate(logbookCheckinSchema),
  asyncHandler(async (req, res) => {
    const { token, officer_id, student_number, lat, lng } = req.body;

    // 1. Validate time token
    if (!SECRET) throw new ApiError(500, "Logbook QR secret not configured.");
    if (!isValidToken(token)) {
      throw new ApiError(
        401,
        "QR code has expired. Please scan the current code displayed in the office."
      );
    }

    // 2. Validate officer + student_number using service key (never exposed publicly)
    const { data: officer, error: officerErr } = await supabase
      .from("officers")
      .select("id, full_name, student_number, status")
      .eq("id", officer_id)
      .is("deleted_at", null)
      .single();

    if (officerErr || !officer) throw new ApiError(404, "Officer not found.");
    if (officer.status !== "active") {
      throw new ApiError(403, "This officer account is not active.");
    }
    if (!officer.student_number) {
      throw new ApiError(
        403,
        "No student number on record for this officer. Contact an admin."
      );
    }
    if (officer.student_number.trim() !== student_number.trim()) {
      throw new ApiError(401, "Student number does not match our records.");
    }

    // 3. Validate geolocation if office coordinates are configured
    const [latRes, lngRes, radRes] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "logbook_lat").single(),
      supabase.from("settings").select("value").eq("key", "logbook_lng").single(),
      supabase.from("settings").select("value").eq("key", "logbook_radius_m").single(),
    ]);

    const officeLat = parseFloat(latRes.data?.value ?? "");
    const officeLng = parseFloat(lngRes.data?.value ?? "");
    const radiusM   = parseFloat(radRes.data?.value ?? "150");

    if (!isNaN(officeLat) && !isNaN(officeLng)) {
      if (lat == null || lng == null) {
        throw new ApiError(
          403,
          "Location permission is required to check in. Please allow location access and try again."
        );
      }
      const dist = haversine(lat, lng, officeLat, officeLng);
      if (dist > radiusM) {
        throw new ApiError(
          403,
          `You appear to be ${Math.round(dist)}m from the CSG office. Check-in requires physical presence (allowed radius: ${radiusM}m).`
        );
      }
    }

    // 4. Block if already checked in today
    const today = todayPH();
    const { data: existing } = await supabase
      .from("logbook_sessions")
      .select("id")
      .eq("officer_id", officer_id)
      .eq("date", today)
      .is("check_out_at", null)
      .maybeSingle();

    if (existing) {
      throw new ApiError(
        409,
        "You are already checked in. Please check out first."
      );
    }

    // 5. Insert session
    const { data: session, error: insertErr } = await supabase
      .from("logbook_sessions")
      .insert({
        officer_id,
        date: today,
        check_in_lat: lat ?? null,
        check_in_lng: lng ?? null,
      })
      .select()
      .single();

    if (insertErr) throw new ApiError(500, insertErr.message);

    return res.status(201).json({
      session,
      officer_name: officer.full_name,
    });
  })
);

/**
 * POST /api/v1/logbook/checkout
 * Body: { officer_id }
 * Closes the open session for the officer today. No PIN required — the
 * exit-QR link and the post-check-in button are the intent signals.
 */
router.post(
  "/checkout",
  validate(logbookCheckoutSchema),
  asyncHandler(async (req, res) => {
    const { officer_id } = req.body;
    const today = todayPH();

    const { data: session } = await supabase
      .from("logbook_sessions")
      .select("id")
      .eq("officer_id", officer_id)
      .eq("date", today)
      .is("check_out_at", null)
      .maybeSingle();

    if (!session) {
      throw new ApiError(404, "No open check-in session found for today.");
    }

    const { error } = await supabase
      .from("logbook_sessions")
      .update({ check_out_at: new Date().toISOString() })
      .eq("id", session.id);

    if (error) throw new ApiError(500, error.message);

    return res.json({ message: "Checked out successfully." });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Admin endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/logbook/admin/earliest
 * Returns the date of the earliest logbook session ever recorded.
 * Used by the export modal to default the "From" date.
 */
router.get(
  "/admin/earliest",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("logbook_sessions")
      .select("date")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    return res.json({ earliest: data?.date ?? null });
  })
);

/**
 * GET /api/v1/logbook/admin/dates
 * Returns all distinct dates that have at least one session.
 * Used by the export modal calendar to disable dates with no records.
 */
router.get(
  "/admin/dates",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("logbook_sessions")
      .select("date")
      .order("date", { ascending: true });

    if (error) throw new ApiError(500, error.message);

    // Deduplicate dates
    const dates = [...new Set((data ?? []).map((r) => r.date))];
    return res.json({ dates });
  })
);

/**
 * GET /api/v1/logbook/admin
 * Query: ?date=YYYY-MM-DD | ?month=YYYY-MM | ?from=YYYY-MM-DD&to=YYYY-MM-DD | ?officer_id=UUID
 * Returns sessions with officer info for admin review.
 */
router.get(
  "/admin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { date, month, from, to, officer_id } = req.query;

    let query = supabase
      .from("logbook_sessions")
      .select(
        `
        id, date, check_in_at, check_out_at, check_in_lat, check_in_lng, auto_checkout, created_at,
        officers ( id, full_name, position, avatar )
      `
      )
      .order("check_in_at", { ascending: true });

    if (from && to) {
      // Explicit date range (used by batch export)
      query = query.gte("date", from).lte("date", to);
    } else if (date) {
      query = query.eq("date", date);
    } else if (month) {
      // YYYY-MM → filter on date range
      const start = `${month}-01`;
      const end = `${month}-31`;
      query = query.gte("date", start).lte("date", end);
    }

    if (officer_id) {
      query = query.eq("officer_id", officer_id);
    }

    const { data: sessions, error } = await query;
    if (error) throw new ApiError(500, error.message);

    const transformed = (sessions ?? []).map((s) => {
      const officer = s.officers;
      const avatarUrl =
        officer?.avatar
          ? anonSupabase.storage
              .from("officers")
              .getPublicUrl(officer.avatar).data.publicUrl
          : null;
      return {
        ...s,
        officer: officer
          ? { ...officer, avatar_url: avatarUrl }
          : null,
        officers: undefined,
      };
    });

    return res.json(transformed);
  })
);

/**
 * POST /api/v1/logbook/admin/checkout
 * Body: { session_id }
 * Force-closes an open session.
 */
router.post(
  "/admin/checkout",
  requireAuth,
  validate(logbookAdminCheckoutSchema),
  asyncHandler(async (req, res) => {
    const { session_id } = req.body;

    const { data: session } = await supabase
      .from("logbook_sessions")
      .select("id, check_out_at")
      .eq("id", session_id)
      .single();

    if (!session) throw new ApiError(404, "Session not found.");
    if (session.check_out_at) {
      throw new ApiError(400, "Session is already closed.");
    }

    const { error } = await supabase
      .from("logbook_sessions")
      .update({ check_out_at: new Date().toISOString() })
      .eq("id", session_id);

    if (error) throw new ApiError(500, error.message);

    return res.json({ message: "Session force-closed." });
  })
);

/**
 * DELETE /api/v1/logbook/admin/delete
 * Body: { session_id }
 * Hard-deletes a session record.
 */
router.delete(
  "/admin/delete",
  requireAuth,
  validate(logbookAdminDeleteSchema),
  asyncHandler(async (req, res) => {
    const { session_id } = req.body;

    const { error } = await supabase
      .from("logbook_sessions")
      .delete()
      .eq("id", session_id);

    if (error) throw new ApiError(500, error.message);

    return res.json({ message: "Session deleted." });
  })
);

export default router;
