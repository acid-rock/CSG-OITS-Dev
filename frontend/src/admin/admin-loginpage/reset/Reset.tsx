import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../login/login.css";

const API_URL = import.meta.env.VITE_API_URL as string;

const Reset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase may deliver the token in query params or in the URL hash fragment
    let token = searchParams.get("access_token");

    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      token = hashParams.get("access_token");
    }

    if (!token) {
      // No token present — this page was opened directly; redirect to login
      navigate("/admin/login", { replace: true });
      return;
    }

    setAccessToken(token);
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/user/reset-password`, {
        access_token: accessToken,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/admin/login", { replace: true }), 2000);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to reset password.")
        : "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-wrapper">
          <img src="/CSG_logo.svg" alt="CSG Logo" className="logo-img" />
        </div>

        <div className="login-header">
          <h2 className="login-title">
            Online Information Transparency System
          </h2>
          <p className="login-subtitle">Set New Password</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ color: "#16a34a", fontWeight: 600 }}>
              Your password has been updated successfully.
            </p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginTop: "0.5rem",
              }}
            >
              Redirecting to login…
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <p className="login-error">{error}</p>}

            <div className="input-group">
              <img src="/padlock.png" alt="Lock" className="input-icon" />
              <input
                type="password"
                placeholder="New Password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="input-group">
              <img src="/padlock.png" alt="Lock" className="input-icon" />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Reset;
