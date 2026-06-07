import { Router }    from "express";
import crypto         from "crypto";
import { promisify }  from "util";
import rateLimit      from "express-rate-limit";
import { supabase }   from "../lib/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError        from "../lib/apiError.js";
import asyncHandler    from "express-async-handler";

const router = Router();

// ── PIN hashing (scrypt via Node built-ins — no extra dependency) ─────────────
// PINs are short committee credentials, not user passwords, so a fixed salt is
// acceptable here. The "scrypt:" prefix lets us distinguish hashed values from
// legacy plaintext so existing PINs keep working until an admin re-saves them.

const scryptAsync = promisify(crypto.scrypt);
// SCRYPT_SALT kept only for verifying legacy fixed-salt hashes (format: "scrypt:<hash>").
// New hashes use a per-value random salt (format: "scrypt:<salt>:<hash>").
const SCRYPT_SALT = "csg-oits-committee-pins";
const SCRYPT_LEN  = 32;

/**
 * Hash a PIN with a freshly generated random salt.
 * Output format: "scrypt:<16-byte-hex-salt>:<32-byte-hex-hash>"
 */
async function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex"); // 32 hex chars
  const key  = await scryptAsync(pin.trim(), salt, SCRYPT_LEN);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

/**
 * Compare a candidate PIN against the stored value.
 * Supports three formats (oldest → newest):
 *   1. Plaintext            — "mysecretpin"
 *   2. Fixed-salt hash      — "scrypt:<64-hex-hash>"
 *   3. Per-value random salt — "scrypt:<32-hex-salt>:<64-hex-hash>"
 *
 * Formats 1 and 2 remain valid until the admin re-saves the PIN,
 * at which point it is automatically upgraded to format 3.
 */
async function verifyPin(candidate, stored) {
  if (stored.startsWith("scrypt:")) {
    const rest  = stored.slice("scrypt:".length);
    const parts = rest.split(":");

    if (parts.length === 2) {
      // Format 3 — random salt: scrypt:<salt>:<hash>
      const [saltHex, storedHex] = parts;
      const key = await scryptAsync(candidate.trim(), saltHex, SCRYPT_LEN);
      const a   = Buffer.from(storedHex, "hex");
      // key is already a Buffer; compare directly (timingSafeEqual)
      return a.length === key.length && crypto.timingSafeEqual(a, key);
    } else {
      // Format 2 — legacy fixed salt: scrypt:<hash>
      const key = await scryptAsync(candidate.trim(), SCRYPT_SALT, SCRYPT_LEN);
      const a   = Buffer.from(rest, "hex");
      return a.length === key.length && crypto.timingSafeEqual(a, key);
    }
  }
  // Format 1 — legacy plaintext fallback
  return candidate.trim() === stored;
}

// ── Strict rate limiter for the public /verify endpoint ───────────────────────
// 10 attempts per IP per 15-minute window.
// At this rate a 4-char lowercase PIN would take ~1.3 years per IP;
// with the 8-char minimum enforced below, brute force is entirely infeasible.
const pinVerifyLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many PIN attempts. Please wait 15 minutes and try again." },
});

// ── Rate limiter for the public /validate-session endpoint ────────────────────
// 30 requests per minute per IP — well above what a single CommitteeProtectedRoute
// navigation needs (1 call) but prevents bulk scraping / DB hammering.
const validateSessionLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests. Please try again." },
});

// ── role → settings key ───────────────────────────────────────────────────────
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

// Helper — load all PINs from DB (returns defaults for missing rows)
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
  return pins;
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/verify
   Public — compare submitted PIN against stored PINs, return role.
   Protected by pinVerifyLimiter (10 req / 15 min per IP).
   Also issues a session nonce so only the most-recent sign-in for
   each role remains active (single-session enforcement).
───────────────────────────────────────────────────────────────── */
router.post(
  "/verify",
  pinVerifyLimiter,
  asyncHandler(async (req, res) => {
    const { pin } = req.body;
    if (!pin || typeof pin !== "string") throw new ApiError(400, "PIN is required.");

    const pins = await loadPins();

    // Find matching role (supports both hashed and legacy plaintext values)
    let matchedRole = null;
    for (const [role, stored] of Object.entries(pins)) {
      if (await verifyPin(pin, stored)) {
        matchedRole = role;
        break;
      }
    }
    if (!matchedRole) throw new ApiError(401, "Invalid PIN. Please try again.");

    // Generate a session nonce — overwrites any existing nonce for this role,
    // invalidating previous sessions on other browsers/tabs.
    const nonce    = crypto.randomUUID();
    const nonceKey = `committee_session_nonce_${matchedRole}`;
    await supabase
      .from("settings")
      .upsert({ key: nonceKey, value: nonce }, { onConflict: "key" });

    return res.status(200).json({ role: matchedRole, nonce });
  })
);

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/validate-session
   Public — verify that a stored nonce matches, confirming the
   caller holds the most-recent session for that role.
───────────────────────────────────────────────────────────────── */
router.post(
  "/validate-session",
  validateSessionLimiter,
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
   Returns placeholder text for hashed values (write-only after hashing).
───────────────────────────────────────────────────────────────── */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pins = await loadPins();
    // Never expose hash strings to the client — return empty string for hashed PINs
    // so the Settings UI shows the input as blank (admin must re-enter to update).
    const safe = {};
    for (const [role, value] of Object.entries(pins)) {
      safe[role] = value.startsWith("scrypt:") ? "" : value;
    }
    return res.status(200).json(safe);
  })
);

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/committee-pins/:role
   Admin-only — update one committee's PIN.
   Minimum 8 characters enforced. PIN is hashed with scrypt before storage.
───────────────────────────────────────────────────────────────── */
router.post(
  "/:role",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { role } = req.params;
    const { pin }  = req.body;

    if (!ROLE_KEYS[role]) throw new ApiError(400, "Unknown committee role.");
    if (!pin || typeof pin !== "string" || pin.trim().length < 8)
      throw new ApiError(400, "PIN must be at least 8 characters.");

    const key    = ROLE_KEYS[role];
    const hashed = await hashPin(pin.trim());

    const { error } = await supabase
      .from("settings")
      .upsert({ key, value: hashed }, { onConflict: "key" });

    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  })
);

export default router;
