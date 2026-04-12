import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    wallet: { create: vi.fn() },
    $transaction: vi.fn((cb: any) => cb({
      user: { create: vi.fn().mockResolvedValue({ id: 'new-user', email: 'new@test.com', displayName: 'New', role: 'USER' }) },
      wallet: { create: vi.fn().mockResolvedValue({}) },
    })),
  },
}));

vi.stubEnv('JWT_SECRET', 'test-secret');

import { register, login, logout, getMe } from '../../../src/services/auth/controller';
import prisma from '../../../src/shared/prisma';
import bcrypt from 'bcryptjs';

function mockReqResNext(body = {}, user?: any) {
  const req = { body, user, params: {}, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('register', () => {
  it('should reject missing email', async () => {
    const { req, res, next } = mockReqResNext({ password: '123', displayName: 'Test' });
    await register(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing password', async () => {
    const { req, res, next } = mockReqResNext({ email: 'a@b.com', displayName: 'Test' });
    await register(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing displayName', async () => {
    const { req, res, next } = mockReqResNext({ email: 'a@b.com', password: '123' });
    await register(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject duplicate email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any);

    const { req, res, next } = mockReqResNext({ email: 'a@b.com', password: '123456', displayName: 'Test' });
    await register(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('DUPLICATE_EMAIL');
  });
});

describe('login', () => {
  it('should reject missing email', async () => {
    const { req, res, next } = mockReqResNext({ password: '123' });
    await login(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing password', async () => {
    const { req, res, next } = mockReqResNext({ email: 'a@b.com' });
    await login(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ email: 'no@user.com', password: '123456' });
    await login(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('logout', () => {
  it('should clear cookie and return success', async () => {
    const { req, res } = mockReqResNext();
    await logout(req, res);

    expect(res.cookie).toHaveBeenCalledWith('token', '', { httpOnly: true, maxAge: 0, path: '/' });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('register - success', () => {
  it('should create user with wallet and return token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({
      email: 'new@test.com', password: 'password123', displayName: 'New User',
    });
    await register(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: expect.any(String),
      user: expect.objectContaining({ email: 'new@test.com' }),
    }));
  });
});

describe('login - success', () => {
  it('should return token for valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', email: 'a@b.com', passwordHash: hash, displayName: 'Test', role: 'USER',
    } as any);

    const { req, res, next } = mockReqResNext({ email: 'a@b.com', password: 'password123' });
    await login(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: expect.any(String),
      user: expect.objectContaining({ id: 'user-1' }),
    }));
  });

  it('should reject wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', email: 'a@b.com', passwordHash: hash, displayName: 'Test', role: 'USER',
    } as any);

    const { req, res, next } = mockReqResNext({ email: 'a@b.com', password: 'wrong' });
    await login(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('getMe', () => {
  it('should return 404 if user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'user-1', email: 'a@b.com', role: 'USER' });
    await getMe(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('should return user data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', email: 'a@b.com', displayName: 'Test', role: 'USER', createdAt: new Date(),
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'user-1', email: 'a@b.com', role: 'USER' });
    await getMe(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1', email: 'a@b.com' }));
  });
});
