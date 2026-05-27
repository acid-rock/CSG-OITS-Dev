import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import asyncHandler from "express-async-handler";

const router = Router();

// role → settings key
const ROLE_KEYS = {
  publication: "committee_pin_publication",
  secretariat: "committee_pin_secretariat",
  finance:     "committee_pin_finance",
};

// Hard-coded defaults if the key has never been saved to DB yet
const DEFAULTS = {
  publication: "pub2026",
  secretariat: "sec2026",
  finance:     "fin2026",
};

// Helper — load all three PINs from DB (returns defaults for missing rows)
async function loadPins() {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", Object.values(ROLE_KEYS));

  if (error) throw new ApiError(500, error.message);

  const pins = {};
  for (const [role, key] of Object.entries(ROLE_KEYS)) {
    const row = data?.find((d) => d.key === key);
    pins[role] = row?.value ?? DEFAULTS[role];
  }
  return pins; // { publication: "...", secretariat: "...", finance: "..." }
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/verify
   Public — compare submitted PIN against stored PINs, return role.
   Also issues a session nonce so only the most-recent sign-in for
   each role remains active (single-session enforcement).
───────────────────────────────────────────────────────────────── */
router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const { pin } = req.body;
    if (!pin || typeof pin !== "string") throw new ApiError(400, "PIN is required.");

    const pins = await loadPins();

    // Reverse-map: value → role
    const role = Object.entries(pins).find(([, v]) => v === pin.trim())?.[0];
    if (!role) throw new ApiError(401, "Invalid PIN. Please try again.");

    // Generate a session nonce — overwrites any existing nonce for this role,
    // invalidating previous sessions on other browsers/tabs.
    const nonce = crypto.randomUUID();
    const nonceKey = `committee_session_nonce_${role}`;
    await supabase
      .from("settings")
      .upsert({ key: nonceKey, value: nonce }, { onConflict: "key" });

    return res.status(200).json({ role, nonce });
  })
);

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/validate-session
   Public — verify that a stored nonce matches, confirming the
   caller holds the most-recent session for that role.
───────────────────────────────────────────────────────────────── */
router.post(
  "/validate-session",
  asyncHandler(async (req, res) => {
    const { role, nonce } = req.body;
    if (!role || !nonce) throw new ApiError(400, "role and nonce are required.");
    if (!ROLE_KEYS[role]) throw new ApiError(400, "Unknown committee role.");

    const nonceKey = `committee_session_nonce_${role}`;
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", nonceKey)
      .single();

    const dbNonce = data?.value ?? null;
    if (!dbNonce || dbNonce !== nonce) {
      return res.status(401).json({ error: "Session invalidated. Please sign in again." });
    }
    return res.status(200).json({ valid: true });
  })
);

/* ─────────────────────────────────────────────────────────────────
   GET /api/v1/committee-pins
   Admin-only — return all current PINs.
───────────────────────────────────────────────────────────────── */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pins = await loadPins();
    return res.status(200).json(pins);
  })
);

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/:role
   Admin-only — update one committee's PIN.
───────────────────────────────────────────────────────────────── */
router.post(
  "/:role",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { role } = req.params;
    const { pin } = req.body;

    if (!ROLE_KEYS[role]) throw new ApiError(400, "Unknown committee role.");
    if (!pin || typeof pin !== "string" || pin.trim().length < 4)
      throw new ApiError(400, "PIN must be at least 4 characters.");

    const key = ROLE_KEYS[role];
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value: pin.trim() }, { onConflict: "key" });

    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  })
);

export default router;
