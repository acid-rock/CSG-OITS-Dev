import { Router } from "express";
import crypto from "crypto";
import { supabase, anonSupabase, createUserClient } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../schemas/index.js";

const router = Router();

// Routes go here
router.post(
  "/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    // TODO: Make this so that admin can only access this route
    const { role, email, password, studentNumber, fullname, nickname } =
      req.body;

    if (!email || !password)
      throw new ApiError(400, "Email and password is required.");

    if (!studentNumber) throw new ApiError(400, "Student number is required.");

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        full_name: fullname,
        display_name: nickname,
        student_number: studentNumber,
      },
      app_metadata: {
        role: role,
      },
    });

    if (error) throw new Error(error.message);

    const { data: tableData, error: tableError } = await supabase
      .from("profiles")
      .insert({
        owner_id: data.user.id,
        role: role,
      });

    if (tableError) throw new Error(tableError.message);

    return res.status(200).json({
      message: `Account for ${studentNumber}, successfully created. Please confirm your email to proceed.`,
    });
  }),
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password is required.");
    }

    const { data, error } = await anonSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

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

    // ── Single-device enforcement — generate a new session nonce ──────────
    // Upserting a new nonce invalidates any existing admin session on other
    // browsers; auth.middleware.js validates this nonce on every requireAuth call.
    const nonce = crypto.randomUUID();
    await supabase
      .from("settings")
      .upsert({ key: "admin_session_nonce", value: nonce }, { onConflict: "key" });
    res.cookie("admin_nonce", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // match refresh token lifespan
    });
    // ──────────────────────────────────────────────────────────────────────

    return res.status(200).json({ message: "Login successful." });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("sb_access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.clearCookie("sb_refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.clearCookie("admin_nonce", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    // Remove the stored nonce so no session can reuse it after logout
    await supabase
      .from("settings")
      .delete()
      .eq("key", "admin_session_nonce");
    return res.sendStatus(200);
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userClient = createUserClient(token);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError) throw new ApiError(500, "Could not retrieve user information.");

    const user = userData.user;
    const email = user.email ?? "";
    const fullName = user.user_metadata?.full_name;
    const emailPrefix = email.split("@")[0];
    const name =
      fullName ||
      (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("owner_id", req.user.sub)
      .single();

    return res.status(200).json({
      name,
      email,
      role: profileData?.role ?? "admin",
    });
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    // FRONTEND_URL may be comma-separated (multi-origin); use only the first value
    // so the redirectTo URL is valid (e.g. "https://csg-oits.vercel.app,http://localhost:5173"
    // → "https://csg-oits.vercel.app")
    const FRONTEND_URL = (process.env.FRONTEND_URL || "").split(",")[0].trim();
    // Always return 200 regardless of whether the email exists (avoids user enumeration)
    if (email) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${FRONTEND_URL}/admin/reset-password`,
      });
    }
    return res.sendStatus(200);
  }),
);

/**
 * Exchange a Supabase PKCE `code` for an access_token.
 * Called by the frontend Reset page when Supabase redirects with ?code= instead
 * of #access_token= (PKCE flow used in newer Supabase projects).
 */
router.post(
  "/exchange-code",
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) throw new ApiError(400, "code is required.");
    const { data, error } = await anonSupabase.auth.exchangeCodeForSession(code);
    if (error) throw new ApiError(400, error.message);
    if (!data?.session?.access_token) throw new ApiError(400, "No session returned.");
    return res.json({ access_token: data.session.access_token });
  }),
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { access_token, new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters.");
    }

    if (!access_token) {
      throw new ApiError(400, "Access token is required.");
    }

    // Verify the recovery token and resolve the user ID.
    // createUserClient().auth.updateUser() fails with "Auth session missing" because
    // it checks the in-memory session object, not the Authorization header.
    // The admin API bypasses that requirement entirely.
    const { data: userData, error: getUserError } = await supabase.auth.getUser(access_token);
    if (getUserError || !userData?.user) throw new ApiError(401, "Recovery link is invalid or has expired.");

    const { error } = await supabase.auth.admin.updateUserById(userData.user.id, {
      password: new_password,
    });
    if (error) throw new ApiError(400, error.message);

    return res.sendStatus(200);
  }),
);

// ── Whitelist ─────────────────────────────────────────────────────────────────
// MANUAL STEP: ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS full_name text;
// MANUAL STEP: ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS student_id text;

router.get(
  "/whitelist",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("whitelist")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data);
  }),
);

router.post(
  "/whitelist",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { email, full_name, student_id } = req.body;

    if (!email && !student_id) {
      throw new ApiError(400, "Provide at least an email or student ID.");
    }

    const { error } = await supabase.from("whitelist").insert({
      email: email || null,
      full_name: full_name || null,
      student_id: student_id || null,
    });
    if (error) throw new ApiError(500, "Whitelist insert failed: " + error.message);
    return res.sendStatus(200);
  }),
);

router.delete(
  "/whitelist",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");
    const { error } = await supabase.from("whitelist").delete().eq("id", id);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

// ── Change Password ───────────────────────────────────────────────────────────

router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      throw new ApiError(400, "All fields are required.");
    }
    if (new_password !== confirm_password) {
      throw new ApiError(400, "Passwords do not match.");
    }
    if (new_password.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters.");
    }
    if (new_password === current_password) {
      throw new ApiError(400, "New password must be different from the current password.");
    }

    const token = req.token;
    const userClient = createUserClient(token);

    // Get current user's email so we can re-authenticate to verify current_password
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user?.email) {
      throw new ApiError(500, "Could not retrieve user information.");
    }

    const { error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: userData.user.email,
      password: current_password,
    });
    if (signInError) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    // Use service-key admin API to update password — avoids "Auth session missing"
    // that occurs when calling userClient.auth.updateUser() with a cookie-based token
    // that lacks a full session object.
    const { error } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { password: new_password },
    );
    if (error) throw new ApiError(500, error.message);

    return res.sendStatus(200);
  }),
);

// ── Admin account list ────────────────────────────────────────────────────────

router.get("/list", requireAuth, async (req, res) => {
  try {
    console.log("[USER LIST] Handler entered");

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("owner_id, role")
      .order("owner_id", { ascending: true });

    console.log("[USER LIST] Profiles result:", JSON.stringify(profiles));
    console.log("[USER LIST] Profiles error:", JSON.stringify(profilesError));

    if (profilesError) throw new ApiError(500, "Profiles fetch failed: " + profilesError.message);

    let users = [];
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      console.log("[USER LIST] Auth users count:", authData?.users?.length);
      console.log("[USER LIST] Auth error:", JSON.stringify(authError));
      if (!authError) users = authData.users;
    } catch (authEx) {
      console.error("[USER LIST] auth.admin.listUsers threw:", authEx.message);
    }

    const result = (profiles ?? []).map((profile) => {
      const authUser = users.find((u) => u.id === profile.owner_id);
      return {
        id: profile.owner_id,
        owner_id: profile.owner_id,
        role: profile.role,
        email: authUser?.email ?? "Unknown",
        // full_name stored in user_metadata at registration time
        full_name: authUser?.user_metadata?.full_name ?? null,
      };
    });

    console.log("[USER LIST] Returning", result.length, "accounts");
    res.json(result);
  } catch (err) {
    console.error("[USER LIST] Caught error:", err.message, err.stack);
    throw err;
  }
});

export default router;
