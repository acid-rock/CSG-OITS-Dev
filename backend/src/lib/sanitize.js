import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p'];
const ALLOWED_ATTRS = {
  'a': ['href', 'target', 'rel'],
};

/**
 * Sanitize user-provided HTML content before storing in the database.
 * Strips all tags except the allowlist. Strips all attributes except
 * href/target/rel on <a> tags. Strips javascript: hrefs.
 *
 * @param {string} content
 * @returns {string} sanitized content
 */
export function sanitizeContent(content) {
  if (!content || typeof content !== 'string') return content;
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: attribs.target || '_blank',
        },
      }),
    },
  });
}
