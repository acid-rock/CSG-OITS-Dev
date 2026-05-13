import ApiError from './apiError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES   = ['application/pdf'];

const MAX_IMAGE_SIZE = 5  * 1024 * 1024;  // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024;  // 20 MB

/**
 * Validate an uploaded image file.
 * Call this after multer, before any storage operation.
 * @param {Express.Multer.File|undefined} file
 * @param {boolean} required - throw if no file uploaded
 */
export function validateImageUpload(file, required = true) {
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
}

/**
 * Validate an uploaded PDF file.
 * @param {Express.Multer.File|undefined} file
 * @param {boolean} required
 */
export function validatePdfUpload(file, required = true) {
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
}
