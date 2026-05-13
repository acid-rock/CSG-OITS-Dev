import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/lib/supabaseClient.js', async () => {
  const { createSupabaseMock } = await import('../mocks/supabase.mock.js');
  const mock = createSupabaseMock();
  return { anonSupabase: mock, supabase: mock, createUserClient: vi.fn(() => mock) };
});

vi.mock('../../src/middlewares/auth.middleware.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { sub: 'test-uuid', email: 'test@admin.com' };
    req.token = 'mock-token';
    next();
  },
}));

vi.mock('../../src/middlewares/audit.middleware.js', () => ({
  auditLogger: () => (req, res, next) => next(),
}));

const { default: app } = await import('../../src/app.js');

describe('GET /api/v1/documents/', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/v1/documents/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/v1/documents/');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe('POST /api/v1/documents/add — path traversal prevention', () => {
  it('returns 400 when name contains path traversal characters', async () => {
    const res = await request(app)
      .post('/api/v1/documents/add')
      .field('name', '../../etc/passwd')
      .field('type', 'memo')
      .field('description', 'Test');
    expect(res.status).toBe(400);
  });

  it('returns 400 when type contains path traversal characters', async () => {
    const res = await request(app)
      .post('/api/v1/documents/add')
      .field('name', 'valid-name')
      .field('type', '../private')
      .field('description', 'Test');
    expect(res.status).toBe(400);
  });

  it('returns 400 when type contains SQL-injection-style special characters', async () => {
    const res = await request(app)
      .post('/api/v1/documents/add')
      .field('name', 'valid-name')
      .field('type', 'memo; DROP TABLE documents;')
      .field('description', 'Test');
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing entirely', async () => {
    const res = await request(app)
      .post('/api/v1/documents/add')
      .field('type', 'memo')
      .field('description', 'Test');
    expect(res.status).toBe(400);
  });

  it('returns 400 when type is missing entirely', async () => {
    const res = await request(app)
      .post('/api/v1/documents/add')
      .field('name', 'valid-name')
      .field('description', 'Test');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/documents/archive — validation', () => {
  it('returns 400 when ids array is empty', async () => {
    const res = await request(app)
      .post('/api/v1/documents/archive')
      .send({ ids: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when ids contains non-UUID values', async () => {
    const res = await request(app)
      .post('/api/v1/documents/archive')
      .send({ ids: ['not-a-uuid'] });
    expect(res.status).toBe(400);
  });
});
