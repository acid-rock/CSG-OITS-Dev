import { createUserClient, supabase } from "../lib/supabaseClient.js";
import jwt from "jsonwebtoken";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

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
    req.supabase = createUserClient(req.token);
    return next();
  } catch (error) {
    if (!refreshToken) {
      return res.status(403).json({ message: "Session expired." });
    }

    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshError || !data.session) throw refreshError;

      res.cookie("sb_access_token", data.session.access_token, {
        httpOnly: true,
        // secure: true, // Change this in production
        sameSite: "strict",
        maxAge: data.session.expires_in * 1000,
      });

      res.cookie("sb_refresh_token", data.session.refresh_token, {
        httpOnly: true,
        // secure: true, // Change this in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      req.user = data.session.user;
      req.supabase = createUserClient(req.token);
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }
  }
}
