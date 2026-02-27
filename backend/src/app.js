import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import announcementRoutes from "./routes/announcements.routes.js";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middlewares/auth.middleware.js";
import cors from "cors";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "../client/dist")));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/test", requireAuth, (req, res) => {
  console.log(req.user);
  return res.send("Passed.");
});

// React
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

export default app;
