import { supabase } from "../lib/supabaseClient.js";
import jwt from "jsonwebtoken";
import { getCached, setCache } from "../lib/cache.js";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/** Shared nonce-check helper (single-device enforcement for admin sessions). */
async function checkAdminNonce(req, res) {
  const adminNonce = req.cookies["admin_nonce"];
  if (!adminNonce) return true; // no nonce cookie → skip check (committee/public users)

  let dbNonce = getCached("admin:session_nonce");
  if (dbNonce === undefined) {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_session_nonce")
      .single();
    dbNonce = data?.value ?? null;
    setCache("admin:session_nonce", dbNonce, 5_000); // 5-second cache
  }

  if (dbNonce && dbNonce !== adminNonce) {
    res.status(401).json({ error: "Session invalidated. Another device has logged in." });
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
 * Sets req.isAdmin = true when a valid admin token is found.
 * Always calls next().
 */
export function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.sb_access_token;
    if (token) {
      jwt.verify(token, SUPABASE_JWT_SECRET);
      req.isAdmin = true;
    }
  } catch {
    // invalid or expired token — treat as public
  }
  next();
}
