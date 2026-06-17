import { describe, it, expect } from 'vitest';
import { validateImageUpload, validatePdfUpload }
  from '../../src/lib/uploadValidation.js';

// Minimal real file signatures so file-type's magic-byte detection succeeds.
// (These are not full valid files — just enough header structure for detection.)
const JPEG_BYTES = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0]);

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // signature
  Buffer.from([0, 0, 0, 13]), Buffer.from('IHDR'), Buffer.alloc(13), Buffer.alloc(4), // IHDR chunk
  Buffer.from([0, 0, 0, 0]), Buffer.from('IDAT'), Buffer.alloc(4), // IDAT chunk
]);

const WEBP_BYTES = Buffer.concat([
  Buffer.from('RIFF'), Buffer.from([0x24, 0, 0, 0]), Buffer.from('WEBP'), Buffer.alloc(4),
]);

const PDF_BYTES = Buffer.from('%PDF-1.4\n%fake pdf content for testing purposes only');

const HTML_BYTES = Buffer.from('<!DOCTYPE html><html><body>fake</body></html>');

function makeFile(mimetype, size, buffer = Buffer.alloc(0)) {
  return { mimetype, size, originalname: 'test-file', buffer };
}

describe('validateImageUpload()', () => {
  it('accepts valid JPEG under size limit', async () => {
    await expect(validateImageUpload(makeFile('image/jpeg', 1_000_000, JPEG_BYTES))).resolves.not.toThrow();
  });

  it('accepts valid PNG under size limit', async () => {
    await expect(validateImageUpload(makeFile('image/png', 2_000_000, PNG_BYTES))).resolves.not.toThrow();
  });

  it('accepts valid WebP under size limit', async () => {
    await expect(validateImageUpload(makeFile('image/webp', 1_000_000, WEBP_BYTES))).resolves.not.toThrow();
  });

  it('throws 415 for non-image MIME type', async () => {
    await expect(validateImageUpload(makeFile('application/pdf', 100, PDF_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 415 for HTML file disguised as image', async () => {
    await expect(validateImageUpload(makeFile('text/html', 100, HTML_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 415 when declared MIME is an image but content is not (spoofed Content-Type)', async () => {
    await expect(validateImageUpload(makeFile('image/png', 100, HTML_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 415 when declared MIME is an image but content is actually a PDF (spoofed Content-Type)', async () => {
    await expect(validateImageUpload(makeFile('image/jpeg', 100, PDF_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 413 when file exceeds 5 MB', async () => {
    await expect(validateImageUpload(makeFile('image/jpeg', 6_000_000, JPEG_BYTES)))
      .rejects.toMatchObject({ status: 413 });
  });

  it('throws 400 when file is missing and required=true', async () => {
    await expect(validateImageUpload(undefined, true))
      .rejects.toMatchObject({ status: 400 });
  });

  it('does not throw when file is missing and required=false', async () => {
    await expect(validateImageUpload(undefined, false)).resolves.not.toThrow();
  });
});

describe('validatePdfUpload()', () => {
  it('accepts valid PDF under size limit', async () => {
    await expect(validatePdfUpload(makeFile('application/pdf', 5_000_000, PDF_BYTES))).resolves.not.toThrow();
  });

  it('throws 415 for image uploaded to PDF endpoint', async () => {
    await expect(validatePdfUpload(makeFile('image/jpeg', 100, JPEG_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 415 when declared MIME is PDF but content is actually an image (spoofed Content-Type)', async () => {
    await expect(validatePdfUpload(makeFile('application/pdf', 100, JPEG_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 415 when declared MIME is PDF but content is HTML (spoofed Content-Type)', async () => {
    await expect(validatePdfUpload(makeFile('application/pdf', 100, HTML_BYTES)))
      .rejects.toMatchObject({ status: 415 });
  });

  it('throws 413 when PDF exceeds 20 MB', async () => {
    await expect(validatePdfUpload(makeFile('application/pdf', 21_000_000, PDF_BYTES)))
      .rejects.toMatchObject({ status: 413 });
  });
});
