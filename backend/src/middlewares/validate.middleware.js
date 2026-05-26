import { ZodError } from 'zod';
import ApiError from '../lib/apiError.js';

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success: replaces req.body with the parsed (type-safe) data and calls next().
 * On failure: throws a 400 ApiError with all validation error messages.
 *
 * Usage: router.post('/add', requireAuth, validate(addAnnouncementSchema), handler)
 *
 * @param {import('zod').ZodSchema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Zod v4 uses err.issues; err.errors was removed in v4
        const issues = err.issues ?? err.errors ?? [];
        const messages = issues.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new ApiError(400, messages.join(' | '));
      }
      throw err;
    }
  };
}
