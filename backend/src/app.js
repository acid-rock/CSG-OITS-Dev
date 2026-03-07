import express from "express";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import announcementRoutes from "./routes/announcements.routes.js";
import eventRoutes from "./routes/events.routes.js";
import officerRoutes from "./routes/officers.routes.js";
import committeeRoutes from "./routes/committee.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
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
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
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
