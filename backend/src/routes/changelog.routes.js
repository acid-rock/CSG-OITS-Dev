import { Router } from "express";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import asyncHandler from "express-async-handler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const changelogPath = join(__dirname, "../../../CHANGELOG.md");
    const content = await readFile(changelogPath, "utf-8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(content);
  }),
);

export default router;
