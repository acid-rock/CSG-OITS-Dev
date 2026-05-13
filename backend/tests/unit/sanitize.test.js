import { describe, it, expect } from 'vitest';
import { sanitizeContent } from '../../src/lib/sanitize.js';

describe('sanitizeContent()', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeContent('Hello world')).toBe('Hello world');
  });

  it('allows whitelisted tags: b, strong, em, i', () => {
    const input = '<b>Bold</b> and <em>italic</em>';
    const result = sanitizeContent(input);
    expect(result).toContain('<b>Bold</b>');
    expect(result).toContain('<em>italic</em>');
  });

  it('strips script tags entirely', () => {
    const input = 'Hello <script>alert("xss")</script> world';
    const result = sanitizeContent(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('strips on* event attributes', () => {
    const input = '<b onclick="alert(1)">Click me</b>';
    const result = sanitizeContent(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('<b>Click me</b>');
  });

  it('strips javascript: href on anchor tags', () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    const result = sanitizeContent(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows safe href on anchor tags and adds rel=noopener', () => {
    const input = '<a href="https://example.com">link</a>';
    const result = sanitizeContent(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('strips disallowed tags like div, span, img', () => {
    const input = '<div><span>text</span><img src="x.jpg"/></div>';
    const result = sanitizeContent(input);
    expect(result).not.toContain('<div>');
    expect(result).not.toContain('<img');
    expect(result).toContain('text');
  });

  it('handles null and undefined gracefully', () => {
    expect(sanitizeContent(null)).toBeNull();
    expect(sanitizeContent(undefined)).toBeUndefined();
  });

  it('handles empty string', () => {
    expect(sanitizeContent('')).toBe('');
  });
});
