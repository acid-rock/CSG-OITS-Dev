import { Router } from "express";
import { supabase, anonSupabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import ApiError from "../lib/apiError.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createUserClient } from "../lib/supabaseClient.js";

const router = Router();

// Routes go here
router.post(
  "/register",
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

// TODO: Fix error handling. Returns 500 when signInWithPassword fails.
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
      secure: false, // NOTE TO SELF: Change to "true" in production
      sameSite: "lax", // NOTE TO SELF: Change to "none" in production
      maxAge: data.session.expires_in * 1000,
    });

    res.cookie("sb_refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: false, // NOTE TO SELF: Change to "true" in production
      sameSite: "lax", // NOTE TO SELF: Change to "none" in production
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Login successful." });
  }),
);

// GET users
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { data, error } = await userSupabase.from("profiles").select("*");
    if (error) throw new ApiError(error.message);

    return res.status(200).json(data);
  }),
);

export default router;
