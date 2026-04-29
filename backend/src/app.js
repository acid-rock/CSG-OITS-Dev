import express from "express";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import announcementRoutes from "./routes/announcements.routes.js";
import eventRoutes from "./routes/events.routes.js";
import officerRoutes from "./routes/officers.routes.js";
import committeeRoutes from "./routes/committee.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import metricsRoutes from "./routes/metrics.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

const FRONTEND_URL = process.env.FRONTEND_URL || "";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

app.set("trust proxy", 1);

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", // TODO: Change to FRONTEND_URL when in production.
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", apiLimiter);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/officers", officerRoutes);
app.use("/api/v1/committees", committeeRoutes);
app.use("/api/v1/auditlogs", auditRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/metrics", metricsRoutes);

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
