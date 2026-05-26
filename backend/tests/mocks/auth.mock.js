import { vi } from 'vitest';

/**
 * Mock requireAuth middleware that simulates an authenticated admin.
 * Replace the real middleware in route tests so you don't need real JWTs.
 */
export const mockRequireAuth = vi.fn((req, res, next) => {
  req.user = {
    sub: 'test-admin-uuid',
    email: 'test@admin.com',
    role: 'admin',
  };
  req.token = 'mock-access-token';
  next();
});

/**
 * Mock requireAuth that simulates an EXPIRED session (returns 401).
 * Use this to test that protected routes reject unauthenticated requests.
 */
export const mockExpiredAuth = vi.fn((req, res, next) => {
  res.status(401).json({ error: 'Session expired' });
});
