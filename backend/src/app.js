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
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

const FRONTEND_URL = process.env.FRONTEND_URL || "";

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
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes — public (stricter) vs admin (generous)
app.use("/api/v1/announcements", publicLimiter, announcementRoutes);
app.use("/api/v1/documents", publicLimiter, documentRoutes);
app.use("/api/v1/events", publicLimiter, eventRoutes);
app.use("/api/v1/officers", publicLimiter, officerRoutes);
app.use("/api/v1/committees", publicLimiter, committeeRoutes);
app.use("/api/v1/equipment", publicLimiter, equipmentRoutes);
app.use("/api/v1/user", adminLimiter, userRoutes);
app.use("/api/v1/dashboard", adminLimiter, dashboardRoutes);
app.use("/api/v1/settings", adminLimiter, settingsRoutes);
app.use("/api/v1/analytics", adminLimiter, analyticsRoutes);
app.use("/api/v1/auditlog", adminLimiter, auditlogRoutes);
app.use("/api/v1/borrowing", adminLimiter, borrowingRoutes);
app.use("/api/v1/changelog", publicLimiter, changelogRoutes);
app.use("/api/v1/organizations", publicLimiter, organizationRoutes);

// Health route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 404 Handler
app.use((req, res, next) => {
  return res.status(404).json({ message: "Route/endpoint not found." });
});

// Global Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (err.isOperational) {
    return res.status(status).json({
      status: "error",
      message: err.message,
    });
  }

  console.error(err);

  res.status(500).json({
    status: "error",
    message: "Something went wrong.",
  });
});

export default app;
