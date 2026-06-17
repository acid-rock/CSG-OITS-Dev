import { fileTypeFromBuffer } from 'file-type';
import ApiError from './apiError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES   = ['application/pdf'];

// file-type normalizes JPEG detection to 'image/jpeg' only (no 'image/jpg' variant).
const ALLOWED_IMAGE_MAGIC_BYTES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PDF_MAGIC_BYTES   = ['application/pdf'];

const MAX_IMAGE_SIZE = 5  * 1024 * 1024;  // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024;  // 20 MB

/**
 * Detect a file's real type from its content (magic bytes) rather than trusting
 * the client-supplied Content-Type header. Returns the detected MIME type, or
 * `null` if the content's signature can't be identified.
 * @param {Buffer|undefined} buffer
 */
async function detectMimeFromBuffer(buffer) {
  if (!buffer || buffer.length === 0) return null;
  const result = await fileTypeFromBuffer(buffer);
  return result?.mime ?? null;
}

/**
 * Validate an uploaded image file.
 * Call this after multer, before any storage operation.
 * Checks the declared Content-Type/size first, then verifies the file's actual
 * magic bytes match an allowed image format — this catches files whose
 * Content-Type header was spoofed to bypass the declared-type check.
 * @param {Express.Multer.File|undefined} file
 * @param {boolean} required - throw if no file uploaded
 */
export async function validateImageUpload(file, required = true) {
  if (!file) {
    if (required) throw new ApiError(400, 'Image file is required');
    return;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ApiError(415, `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new ApiError(413, 'Image file too large. Maximum size is 5 MB');
  }

  const detectedMime = await detectMimeFromBuffer(file.buffer);
  if (!detectedMime || !ALLOWED_IMAGE_MAGIC_BYTES.includes(detectedMime)) {
    throw new ApiError(415, 'File content does not match a valid image format');
  }
}

/**
 * Validate an uploaded PDF file.
 * Checks the declared Content-Type/size first, then verifies the file's actual
 * magic bytes are a real PDF — this catches files whose Content-Type header
 * was spoofed to bypass the declared-type check.
 * @param {Express.Multer.File|undefined} file
 * @param {boolean} required
 */
export async function validatePdfUpload(file, required = true) {
  if (!file) {
    if (required) throw new ApiError(400, 'PDF file is required');
    return;
  }
  if (!ALLOWED_PDF_TYPES.includes(file.mimetype)) {
    throw new ApiError(415, 'Invalid file type. Only PDF files are accepted');
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new ApiError(413, 'PDF file too large. Maximum size is 20 MB');
  }

  const detectedMime = await detectMimeFromBuffer(file.buffer);
  if (!detectedMime || !ALLOWED_PDF_MAGIC_BYTES.includes(detectedMime)) {
    throw new ApiError(415, 'File content does not match a valid PDF format');
  }
}
