import { Router } from "express";
import { supabase, anonSupabase } from "../lib/supabaseClient.js";

// Middleware

const router = Router();

// Routes go here
router.post("/register", async (req, res) => {
  // TODO: Make this so that admin can only access this route
  const { role, email, password, studentNumber, fullname, nickname } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  if (!password)
    return res.status(400).json({ message: "Password is required." });

  if (!studentNumber)
    return res.status(400).json({ message: "Student number is required." });

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Remove in production
    user_metadata: {
      full_name: fullname,
      display_name: nickname,
      student_number: studentNumber,
    },
    app_metadata: {
      role: role,
    },
  });

  console.log(data);

  if (error) return res.status(400).json({ message: error.message });

  const { data: tableData, error: tableError } = await supabase
    .from("profiles")
    .insert({
      owner_id: data.user.id,
      role: role,
    });

  if (tableError) return res.status(400).json({ message: tableError.message });

  return res.status(200).json({
    message: `Account for ${studentNumber}, successfully created. Please confirm your email to proceed.`,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  if (!password)
    return res.status(400).json({ message: "Password is required." });

  const { data, error } = await anonSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ message: error.message });

  res.cookie("sb_access_token", data.session.access_token, {
    httpOnly: true,
    maxAge: data.session.expires_in * 1000,
  });

  res.cookie("sb_refresh_token", data.session.refresh_token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.sendStatus(200);
});

export default router;
