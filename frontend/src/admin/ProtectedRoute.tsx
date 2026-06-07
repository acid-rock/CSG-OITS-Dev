/**
 * ProtectedRoute — wraps all /admin/* routes.
 *
 * Security model:
 *   The real auth boundary is the HttpOnly `sb_access_token` cookie validated
 *   by `requireAuth` on every protected backend endpoint. This component enforces
 *   the same check on the *client* by calling GET /user/me with credentials.
 *
 *   Previous approach (localStorage flag) was bypassable: anyone could open
 *   DevTools and type `localStorage.setItem('admin_authenticated','1')` to
 *   render the admin UI without a valid session. A forged flag cannot fake the
 *   HttpOnly cookie, but it still exposed the panel structure unnecessarily.
 *
 *   The server-side check here closes that gap: unauthenticated visitors are
 *   redirected before any admin UI is rendered.
 */
import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import axios from "axios";
import "../index.css";

const API = import.meta.env.VITE_API_URL as string;

const ProtectedRoute = () => {
  const navigate = useNavigate();

  // null = still checking · true = valid session · false = no valid session
  const [status, setStatus] = useState<"checking" | "ok" | "denied">(
    "checking",
  );

  useEffect(() => {
    axios
      .get(`${API}/user/me`, { withCredentials: true })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("denied"));
  }, []);

  /* ── Checking ── */
  if (status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6fd",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: "#9ca3af",
          fontSize: "0.9rem",
        }}
      >
        Verifying session…
      </div>
    );
  }

  /* ── Denied ── */
  if (status === "denied") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#f4f6fd",
          padding: "2rem",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <Lock size={48} color="#4f6fd1" strokeWidth={1.5} />
        <h2
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#0f1729",
          }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "0.95rem",
            textAlign: "center",
            maxWidth: 380,
          }}
        >
          You must be an authorized CSG admin to view this page.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => navigate("/admin/login")}
            style={{
              padding: "0.6rem 1.5rem",
              background: "#4f6fd1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              fontFamily: "inherit",
            }}
          >
            Go to Login
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.6rem 1.5rem",
              background: "#fff",
              color: "#374151",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              fontFamily: "inherit",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ── Authenticated ── */
  return <Outlet />;
};

export default ProtectedRoute;
