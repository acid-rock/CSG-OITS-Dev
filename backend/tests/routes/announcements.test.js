import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock Supabase BEFORE importing app — ESM async factory (no require())
vi.mock('../../src/lib/supabaseClient.js', async () => {
  const { createSupabaseMock } = await import('../mocks/supabase.mock.js');
  const mock = createSupabaseMock();
  return {
    anonSupabase: mock,
    supabase: mock,
    createUserClient: vi.fn(() => mock),
  };
});

// Mock requireAuth to simulate authenticated admin
vi.mock('../../src/middlewares/auth.middleware.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { sub: 'test-admin-uuid', email: 'test@admin.com' };
    req.token = 'mock-token';
    next();
  },
}));

// Mock audit middleware (fire-and-forget — not relevant to route tests)
vi.mock('../../src/middlewares/audit.middleware.js', () => ({
  auditLogger: () => (req, res, next) => next(),
}));

// Import app AFTER mocks are established
const { default: app } = await import('../../src/app.js');

describe('GET /api/v1/announcements/', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/v1/announcements/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/v1/announcements/');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('POST /api/v1/announcements/add — validation', () => {
  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/add')
      .field('content', 'Some content')
      .field('category', 'CSG Updates');
    expect(res.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/add')
      .field('title', 'Test Title')
      .field('category', 'CSG Updates');
    expect(res.status).toBe(400);
  });

  it('returns 400 when category is not a valid enum value', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/add')
      .field('title', 'Test')
      .field('content', 'Content')
      .field('category', 'InvalidCategory');
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/announcements/delete — validation', () => {
  it('returns 400 when ids array is empty', async () => {
    const res = await request(app)
      .delete('/api/v1/announcements/delete')
      .send({ ids: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids contains non-UUID values', async () => {
    const res = await request(app)
      .delete('/api/v1/announcements/delete')
      .send({ ids: ['not-a-uuid'] });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/announcements/pin — validation', () => {
  it('returns 400 when id is not a valid UUID', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/pin')
      .send({ id: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/announcements/archive — validation', () => {
  it('returns 400 when ids array is empty', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/archive')
      .send({ ids: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids contains non-UUID values', async () => {
    const res = await request(app)
      .post('/api/v1/announcements/archive')
      .send({ ids: ['bad-id'] });
    expect(res.status).toBe(400);
  });
});
