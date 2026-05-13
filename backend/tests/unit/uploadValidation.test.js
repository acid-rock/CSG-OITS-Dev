import { describe, it, expect } from 'vitest';
import { validateImageUpload, validatePdfUpload }
  from '../../src/lib/uploadValidation.js';

function makeFile(mimetype, size) {
  return { mimetype, size, originalname: 'test-file' };
}

describe('validateImageUpload()', () => {
  it('accepts valid JPEG under size limit', () => {
    expect(() => validateImageUpload(makeFile('image/jpeg', 1_000_000))).not.toThrow();
  });

  it('accepts valid PNG under size limit', () => {
    expect(() => validateImageUpload(makeFile('image/png', 2_000_000))).not.toThrow();
  });

  it('accepts valid WebP under size limit', () => {
    expect(() => validateImageUpload(makeFile('image/webp', 1_000_000))).not.toThrow();
  });

  it('throws 415 for non-image MIME type', () => {
    expect(() => validateImageUpload(makeFile('application/pdf', 100)))
      .toThrow(expect.objectContaining({ status: 415 }));
  });

  it('throws 415 for HTML file disguised as image', () => {
    expect(() => validateImageUpload(makeFile('text/html', 100)))
      .toThrow(expect.objectContaining({ status: 415 }));
  });

  it('throws 413 when file exceeds 5 MB', () => {
    expect(() => validateImageUpload(makeFile('image/jpeg', 6_000_000)))
      .toThrow(expect.objectContaining({ status: 413 }));
  });

  it('throws 400 when file is missing and required=true', () => {
    expect(() => validateImageUpload(undefined, true))
      .toThrow(expect.objectContaining({ status: 400 }));
  });

  it('does not throw when file is missing and required=false', () => {
    expect(() => validateImageUpload(undefined, false)).not.toThrow();
  });
});

describe('validatePdfUpload()', () => {
  it('accepts valid PDF under size limit', () => {
    expect(() => validatePdfUpload(makeFile('application/pdf', 5_000_000))).not.toThrow();
  });

  it('throws 415 for image uploaded to PDF endpoint', () => {
    expect(() => validatePdfUpload(makeFile('image/jpeg', 100)))
      .toThrow(expect.objectContaining({ status: 415 }));
  });

  it('throws 413 when PDF exceeds 20 MB', () => {
    expect(() => validatePdfUpload(makeFile('application/pdf', 21_000_000)))
      .toThrow(expect.objectContaining({ status: 413 }));
  });
});
