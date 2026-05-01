import { Router } from "express";
import { supabase, anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

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
      maxAge: data.session.expires_in * 1000,
    });

    res.cookie("sb_refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
    return res.sendStatus(200);
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    // Always return 200 regardless of whether the email exists (avoids user enumeration)
    if (email) {
      await supabase.auth.resetPasswordForEmail(email);
    }
    return res.sendStatus(200);
  }),
);

export default router;
