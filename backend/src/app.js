import express from "express";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import announcementRoutes from "./routes/announcements.routes.js";
import eventRoutes from "./routes/events.routes.js";
import officerRoutes from "./routes/officers.routes.js";
import committeeRoutes from "./routes/committee.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import auditlogRoutes from "./routes/auditlog.routes.js";
import borrowingRoutes from "./routes/borrowing.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import changelogRoutes from "./routes/changelog.routes.js";
import organizationRoutes from "./routes/organizations.routes.js";
import membershipRoutes from "./routes/committee-memberships.routes.js";
import viewsRoutes from "./routes/views.routes.js";
import committeePinsRoutes from "./routes/committee-pins.routes.js";
import accessRoutes from "./routes/access.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

// Support comma-separated origins so both localhost and production Vercel URL
// can be listed in a single FRONTEND_URL env var:
//   FRONTEND_URL=https://csg-oits.vercel.app,http://localhost:5173
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const supabaseHost = new URL(process.env.SUPABASE_URL || "https://placeholder.supabase.co").hostname;

// Public routes — stricter limit
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Admin/authenticated routes — more generous limit
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const app = express();

app.set("trust proxy", 1);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", `https://${supabaseHost}`, "data:", "blob:"],
      mediaSrc:       ["'self'", `https://${supabaseHost}`],
      connectSrc:     ["'self'", `https://${supabaseHost}`],
      frameSrc:       ["'self'", `https://${supabaseHost}`],
      fontSrc:        ["'self'", "data:"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / Postman / same-origin requests (no Origin header)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin "${origin}" is not allowed`));
    },
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes — public (stricter) vs admin (generous)
// NOTE: officers, committees, equipment, organizations serve BOTH the public
// homepage AND the admin panel.  Because all three lists are cached for 60 s
// on the backend, real DB hits are rare.  The bottleneck is the admin panel
// making many requests from a single IP in a short window, which quickly
// exhausts the public 100 req/15 min bucket.  Moving them to adminLimiter
// (500 req/15 min) removes that wall without meaningful risk — public traffic
// on a small CSG site will never come close to 500 req/15 min per IP.
// Moving announcements/documents/events to adminLimiter (500/15min).
// Rationale: the admin panel pre-fetches counts for all three tabs on every
// module load, which easily exhausts the 100/15min public bucket and causes
// 429 errors during normal admin use. A small CSG site's public traffic will
// never approach 500 req/15min per IP, so this is safe for public users too.
app.use("/api/v1/announcements", adminLimiter,  announcementRoutes);
app.use("/api/v1/documents",     adminLimiter,  documentRoutes);
app.use("/api/v1/events",        adminLimiter,  eventRoutes);
app.use("/api/v1/changelog",     publicLimiter, changelogRoutes);
// POST /track is public (anon visits); GET /stats is admin-gated inside the router
app.use("/api/v1/views",         publicLimiter, viewsRoutes);
app.use("/api/v1/officers",      adminLimiter,  officerRoutes);      // was publicLimiter
app.use("/api/v1/committees",    adminLimiter,  committeeRoutes);    // was publicLimiter
app.use("/api/v1/equipment",     adminLimiter,  equipmentRoutes);    // was publicLimiter
app.use("/api/v1/organizations", adminLimiter,  organizationRoutes); // was publicLimiter
app.use("/api/v1/memberships",  adminLimiter,  membershipRoutes);
app.use("/api/v1/user",          adminLimiter,  userRoutes);
app.use("/api/v1/dashboard",     adminLimiter,  dashboardRoutes);
app.use("/api/v1/settings",      adminLimiter,  settingsRoutes);
app.use("/api/v1/analytics",     adminLimiter,  analyticsRoutes);
app.use("/api/v1/auditlog",      adminLimiter,  auditlogRoutes);
app.use("/api/v1/borrowing",     adminLimiter,  borrowingRoutes);
app.use("/api/v1/committee-pins", adminLimiter, committeePinsRoutes);
app.use("/api/v1/access",        publicLimiter, accessRoutes);

// Health route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 404 Handler
app.use((req, res, next) => {
  return res.status(404).json({ message: "Route/endpoint not found." });
});

// Global Error handler — must be last middleware
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";

  if (err.isOperational) {
    return res.status(err.status || 500).json({
      error: err.message,
    });
  }

  console.error("Unexpected error:", err);

  return res.status(500).json({
    error: isDev
      ? err.message
      : "An unexpected error occurred. Please try again later.",
    ...(isDev && { stack: err.stack }),
  });
});

export default app;
