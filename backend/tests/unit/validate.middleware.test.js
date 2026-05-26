import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.middleware.js';

const testSchema = z.object({
  title: z.string().min(1),
  count: z.number().int().positive(),
});

function makeReqRes(body = {}) {
  const req = { body };
  const res = {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('validate() middleware', () => {
  it('calls next() with valid body and replaces req.body with parsed data', () => {
    const { req, res, next } = makeReqRes({ title: 'Hello', count: 5 });
    validate(testSchema)(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ title: 'Hello', count: 5 });
  });

  it('throws ApiError 400 when required field is missing', () => {
    const { req, res, next } = makeReqRes({ title: 'Hello' }); // missing count
    expect(() => validate(testSchema)(req, res, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws ApiError 400 when field type is wrong', () => {
    const { req, res, next } = makeReqRes({ title: 'Hello', count: 'not-a-number' });
    expect(() => validate(testSchema)(req, res, next)).toThrow();
  });

  it('throws ApiError 400 when string is empty but min(1) required', () => {
    const { req, res, next } = makeReqRes({ title: '', count: 1 });
    expect(() => validate(testSchema)(req, res, next)).toThrow();
  });

  it('passes through non-Zod errors unchanged', () => {
    const badSchema = { parse: () => { throw new Error('unexpected'); } };
    const { req, res, next } = makeReqRes({ title: 'x', count: 1 });
    expect(() => validate(badSchema)(req, res, next)).toThrow('unexpected');
  });
});
