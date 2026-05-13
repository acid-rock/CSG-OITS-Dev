import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/lib/supabaseClient.js', async () => {
  const { createSupabaseMock } = await import('../mocks/supabase.mock.js');
  const mock = createSupabaseMock();

  // Configure count responses for the summary endpoint
  mock.from.mockImplementation(() => {
    const countResponse = { count: 10, data: [], error: null };
    const promise = Promise.resolve(countResponse);
    return {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      is:          vi.fn().mockReturnThis(),
      not:         vi.fn().mockReturnThis(),
      limit:       vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then:        promise.then.bind(promise),
      catch:       promise.catch.bind(promise),
    };
  });

  return { anonSupabase: mock, supabase: mock, createUserClient: vi.fn(() => mock) };
});

const { default: app } = await import('../../src/app.js');

describe('GET /api/v1/dashboard/summary', () => {
  it('returns 200 with expected top-level shape', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('officers');
    expect(res.body).toHaveProperty('committees');
    expect(res.body).toHaveProperty('documents');
    expect(res.body).toHaveProperty('announcements');
    expect(res.body).toHaveProperty('events');
    expect(res.body).toHaveProperty('equipment');
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('returns numeric values for all count fields', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(typeof res.body.officers?.total).toBe('number');
    expect(typeof res.body.officers?.active).toBe('number');
    expect(typeof res.body.committees?.active).toBe('number');
    expect(typeof res.body.equipment?.available).toBe('number');
  });

  it('returns a pinnedAnnouncement field (null when none pinned)', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect('pinnedAnnouncement' in res.body).toBe(true);
  });
});
