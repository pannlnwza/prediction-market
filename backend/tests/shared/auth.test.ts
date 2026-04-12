import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate, requireRole, requireServiceKey } from '../../src/shared/auth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-jwt-secret';
const TEST_SERVICE_KEY = 'test-service-key';

function mockReqResNext(overrides: Partial<Request> = {}) {
  const req = {
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('authenticate', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_SECRET);
  });

  it('should authenticate with valid Bearer token', () => {
    const token = jwt.sign({ id: 'user-1', email: 'a@b.com', role: 'USER' }, TEST_SECRET);
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` } as any,
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-1', email: 'a@b.com', role: 'USER' });
  });

  it('should authenticate with cookie token', () => {
    const token = jwt.sign({ id: 'user-2', email: 'b@c.com', role: 'ADMIN' }, TEST_SECRET);
    const { req, res, next } = mockReqResNext();
    (req as any).cookies = { token };

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.role).toBe('ADMIN');
  });

  it('should reject missing token', () => {
    const { req, res, next } = mockReqResNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    const { req, res, next } = mockReqResNext({
      headers: { authorization: 'Bearer invalid-token' } as any,
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  });

  it('should reject expired token', () => {
    const token = jwt.sign({ id: 'user-1', email: 'a@b.com', role: 'USER' }, TEST_SECRET, { expiresIn: '-1s' });
    const { req, res, next } = mockReqResNext({
      headers: { authorization: `Bearer ${token}` } as any,
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireRole', () => {
  it('should allow matching role', () => {
    const middleware = requireRole('ADMIN', 'RESOLVER');
    const { req, res, next } = mockReqResNext();
    req.user = { id: '1', email: 'a@b.com', role: 'ADMIN' };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject non-matching role', () => {
    const middleware = requireRole('ADMIN');
    const { req, res, next } = mockReqResNext();
    req.user = { id: '1', email: 'a@b.com', role: 'USER' };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject missing user', () => {
    const middleware = requireRole('USER');
    const { req, res, next } = mockReqResNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireServiceKey', () => {
  beforeEach(() => {
    vi.stubEnv('SERVICE_KEY', TEST_SERVICE_KEY);
  });

  it('should allow valid service key', () => {
    const { req, res, next } = mockReqResNext({
      headers: { 'x-service-key': TEST_SERVICE_KEY } as any,
    });

    requireServiceKey(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid service key', () => {
    const { req, res, next } = mockReqResNext({
      headers: { 'x-service-key': 'wrong-key' } as any,
    });

    requireServiceKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject missing service key', () => {
    const { req, res, next } = mockReqResNext();

    requireServiceKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
