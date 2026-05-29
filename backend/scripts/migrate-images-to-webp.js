/**
 * One-time script: converts all existing images in Supabase Storage to WebP.
 * Run from the backend directory: node scripts/migrate-images-to-webp.js
 *
 * Before converting, each original file is saved to scripts/backup/<bucket>/<path>
 * so it can be restored if anything looks wrong after migration.
 *
 * To restore a single file manually:
 *   node scripts/restore-backup.js <bucket> <path>
 * or re-upload via the admin panel (new uploads auto-convert to WebP anyway).
 *
 * Re-uploads each file to the SAME path with WebP content and a 1-year
 * cache-control header. No database changes are needed because public URLs
 * are path-based and remain identical after re-upload.
 *
 * Buckets processed: officers, bulletin, events, committees, organizations
 * Skipped: documents (PDFs), thumbnails (already generated externally), equipment
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, "backup");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const IMAGE_BUCKETS = ["officers", "bulletin", "events", "committees", "organizations"];

// List all objects recursively (Supabase Storage list() is non-recursive)
async function listAll(bucket, prefix = "") {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list(${bucket}/${prefix}): ${error.message}`);

  const files = [];
  for (const item of data ?? []) {
    if (item.name.startsWith(".")) continue; // skip .emptyFolderPlaceholder etc.
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      // Has metadata → it's a file
      files.push(fullPath);
    } else {
      // No metadata → it's a folder, recurse
      const nested = await listAll(bucket, fullPath);
      files.push(...nested);
    }
  }
  return files;
}

async function migrateBucket(bucketName) {
  console.log(`\n── ${bucketName} ──`);
  const paths = await listAll(bucketName);

  if (paths.length === 0) {
    console.log("  (empty)");
    return { processed: 0, skipped: 0, failed: 0, savedBytes: 0 };
  }

  let processed = 0, skipped = 0, failed = 0, savedBytes = 0;

  for (const path of paths) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from(bucketName)
        .download(path);
      if (dlError) throw new Error(dlError.message);

      const originalBuffer = Buffer.from(await fileData.arrayBuffer());

      // Detect if already WebP to avoid re-processing
      const meta = await sharp(originalBuffer).metadata();
      if (meta.format === "webp") {
        console.log(`  skip  ${path} (already WebP)`);
        skipped++;
        continue;
      }

      // Save original to disk BEFORE overwriting
      const backupPath = join(BACKUP_DIR, bucketName, path);
      await mkdir(dirname(backupPath), { recursive: true });
      await writeFile(backupPath, originalBuffer);

      const converted = await sharp(originalBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: upError } = await supabase.storage
        .from(bucketName)
        .upload(path, converted, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (upError) throw new Error(upError.message);

      const saved = originalBuffer.length - converted.length;
      savedBytes += saved;
      console.log(
        `  ok    ${path}  ${(originalBuffer.length / 1024).toFixed(0)} KB → ${(converted.length / 1024).toFixed(0)} KB  (-${((saved / originalBuffer.length) * 100).toFixed(0)}%)`,
      );
      processed++;
    } catch (err) {
      console.error(`  FAIL  ${path}: ${err.message}`);
      failed++;
    }
  }

  return { processed, skipped, failed, savedBytes };
}

async function main() {
  console.log("Starting WebP migration…");
  console.log(`Originals will be backed up to: ${BACKUP_DIR}`);
  let totalProcessed = 0, totalSkipped = 0, totalFailed = 0, totalSaved = 0;

  for (const bucket of IMAGE_BUCKETS) {
    const { processed, skipped, failed, savedBytes } = await migrateBucket(bucket);
    totalProcessed += processed;
    totalSkipped += skipped;
    totalFailed += failed;
    totalSaved += savedBytes;
  }

  console.log("\n── Summary ──");
  console.log(`  Converted : ${totalProcessed}`);
  console.log(`  Already WebP (skipped): ${totalSkipped}`);
  console.log(`  Failed    : ${totalFailed}`);
  console.log(`  Storage saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Originals backed up to: ${BACKUP_DIR}`);

  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
