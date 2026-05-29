/**
 * Restore a single backed-up original to Supabase Storage.
 * Usage: node scripts/restore-backup.js <bucket> <path>
 *
 * Example:
 *   node scripts/restore-backup.js officers abc123.jpg
 *   node scripts/restore-backup.js events uuid/0.jpg
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const [bucket, filePath] = process.argv.slice(2);
if (!bucket || !filePath) {
  console.error("Usage: node scripts/restore-backup.js <bucket> <path>");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const backupFile = join(__dirname, "backup", bucket, filePath);

const buffer = await readFile(backupFile).catch(() => {
  console.error(`Backup file not found: ${backupFile}`);
  process.exit(1);
});

const { error } = await supabase.storage
  .from(bucket)
  .upload(filePath, buffer, { upsert: true });

if (error) {
  console.error(`Restore failed: ${error.message}`);
  process.exit(1);
}

console.log(`Restored: ${bucket}/${filePath}`);
