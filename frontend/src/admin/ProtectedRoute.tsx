import { Outlet, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import "../index.css";

// Note: sb_access_token is httpOnly — it cannot be read by document.cookie (by design).
// We track auth state with a localStorage flag set on login and cleared on logout.
// The backend requireAuth middleware is the real security boundary on every protected request.
const ProtectedRoute = () => {
  const navigate = useNavigate();

  try {
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "1";

    if (!isAuthenticated) {
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
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return <Outlet />;
  } catch {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button onClick={() => navigate("/admin/login")}>Go to Login</button>
      </div>
    );
  }
};

export default ProtectedRoute;
