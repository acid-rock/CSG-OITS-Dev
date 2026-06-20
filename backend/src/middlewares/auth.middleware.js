import { supabase } from "../lib/supabaseClient.js";
import jwt from "jsonwebtoken";
import { getCached, setCache } from "../lib/cache.js";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/** Resolve the user id from whatever shape req.user has. */
function resolveUserId(req) {
  // Normal path sets req.user = JWT payload (has `sub`); the refresh path sets
  // req.user = Supabase user object (has `id`).
  return req.user?.sub ?? req.user?.id ?? null;
}

/**
 * Read the per-user session nonce stored in `settings`.
 * Keyed per user so each admin has an independent single-device session — a
 * login by one admin no longer invalidates every other admin's session.
 * Returns the stored nonce string, or null when none exists (logged out).
 */
async function getDbNonce(userId) {
  if (!userId) return null;
  const cacheKey = `admin:session_nonce:${userId}`;
  let dbNonce = getCached(cacheKey);
  if (dbNonce === undefined) {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", `admin_session_nonce:${userId}`)
      .single();
    dbNonce = data?.value ?? null;
    setCache(cacheKey, dbNonce, 5_000); // 5-second cache
  }
  return dbNonce;
}

/** Shared nonce-check helper (single-device enforcement per admin). */
async function checkAdminNonce(req, res) {
  const adminNonce = req.cookies["admin_nonce"];
  if (!adminNonce) {
    // Nonce cookie absent — caller either cleared cookies after logout or is
    // presenting only JWT cookies without the nonce. Reject unconditionally:
    // every legitimate admin session receives the nonce cookie at login.
    res.status(401).json({ error: "Session cookie missing or expired. Please log in again." });
    return false;
  }

  const dbNonce = await getDbNonce(resolveUserId(req));

  // Deny unless a stored nonce exists AND matches the cookie. An absent stored
  // nonce means the session was logged out (the row is deleted on logout), so a
  // still-valid but revoked JWT cannot be replayed until its natural expiry.
  if (!dbNonce || dbNonce !== adminNonce) {
    res.status(401).json({ error: "Session invalidated. Please log in again." });
    return false;
  }
  return true;
}

/** HTTP methods that mutate state and therefore require CSRF protection. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF double-submit check.
 * Cookies are SameSite=None (frontend and API are cross-site), so a forged
 * cross-site request would carry the auth cookies but cannot read the
 * non-httpOnly csrf_token cookie to replay it in the X-CSRF-Token header.
 * Returns true when the request is safe to proceed.
 */
function checkCsrf(req, res) {
  if (!UNSAFE_METHODS.has(req.method)) return true; // GET/HEAD/OPTIONS are safe
  const headerToken = req.get("x-csrf-token");
  const cookieToken = req.cookies?.csrf_token;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    res.status(403).json({ error: "Invalid or missing CSRF token." });
    return false;
  }
  return true;
}

export async function requireAuth(req, res, next) {
  let accessToken = req.cookies["sb_access_token"];
  const refreshToken = req.cookies["sb_refresh_token"];

  if (!accessToken && !refreshToken) {
    return res.status(403).json({ message: "Not authenticated." });
  }

  // CSRF gate runs before any auth work — every state-changing admin route
  // passes through requireAuth, so this is the single enforcement point.
  if (!checkCsrf(req, res)) return;

  try {
    const payload = jwt.verify(accessToken, SUPABASE_JWT_SECRET);

    req.user = payload;
    req.token = accessToken;

    // Single-device enforcement
    if (!(await checkAdminNonce(req, res))) return;

    return next();
  } catch (error) {
    if (!refreshToken) {
      return res.status(401).json({ error: "Session expired" });
    }

    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshError || !data.session) throw refreshError;

      res.cookie("sb_access_token", data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 1000,
      });

      res.cookie("sb_refresh_token", data.session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      req.user = data.session.user;
      req.token = data.session.access_token;

      // Single-device enforcement after token refresh
      if (!(await checkAdminNonce(req, res))) return;

      next();
    } catch (error) {
      return res.status(401).json({ error: "Session expired" });
    }
  }
}

/**
 * optionalAuth — attempts JWT verification without blocking the request.
 * Sets req.isAdmin = true only when the token is valid AND the admin nonce
 * cookie matches the active session nonce in the DB (preventing revoked /
 * post-logout JWTs from receiving admin-only response fields such as
 * student_number). Always calls next() — never rejects the request.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.sb_access_token;
    if (token) {
      const payload = jwt.verify(token, SUPABASE_JWT_SECRET);

      // Require the nonce cookie to be present and match the active session.
      // Without this check, a revoked (post-logout) JWT that hasn't expired yet
      // would still receive req.isAdmin = true and admin-only response fields.
      const cookieNonce = req.cookies?.admin_nonce;
      if (cookieNonce) {
        const dbNonce = await getDbNonce(payload?.sub ?? null);
        // isAdmin = true ONLY when a stored per-user nonce exists and matches.
        // A missing stored nonce means the session was logged out → not admin.
        req.isAdmin = Boolean(dbNonce) && dbNonce === cookieNonce;
      }
      // No nonce cookie → JWT alone is insufficient proof of an active admin
      // session. req.isAdmin stays undefined (falsy); request proceeds as public.
    }
  } catch {
    // invalid or expired token — treat as public
  }
  next();
}
