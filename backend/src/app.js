import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../client/dist")));

// Routes
// React
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

export default app;
