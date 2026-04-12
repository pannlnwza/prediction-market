import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn() },
    $transaction: vi.fn((cb: any) => cb({
      wallet: { findUnique: vi.fn(), update: vi.fn() },
      transaction: { create: vi.fn() },
      escrow: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
      order: { findMany: vi.fn().mockResolvedValue([]) },
      position: { findMany: vi.fn().mockResolvedValue([]) },
    })),
  },
}));

import { deposit, withdraw, lockEscrow, releaseEscrow, refundEscrow, payout } from '../../../src/services/wallet/controller';

function mockReqResNext(body = {}, user = { id: 'user-1', email: 'a@b.com', role: 'USER' }) {
  const req = { body, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('deposit validation', () => {
  it('should reject zero amount', async () => {
    const { req, res, next } = mockReqResNext({ amount: 0 });
    await deposit(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject negative amount', async () => {
    const { req, res, next } = mockReqResNext({ amount: -10 });
    await deposit(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing amount', async () => {
    const { req, res, next } = mockReqResNext({});
    await deposit(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('withdraw validation', () => {
  it('should reject zero amount', async () => {
    const { req, res, next } = mockReqResNext({ amount: 0 });
    await withdraw(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject negative amount', async () => {
    const { req, res, next } = mockReqResNext({ amount: -5 });
    await withdraw(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('lockEscrow validation', () => {
  it('should reject missing userId', async () => {
    const { req, res, next } = mockReqResNext({ orderId: 'o1', amount: 10 });
    await lockEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing orderId', async () => {
    const { req, res, next } = mockReqResNext({ userId: 'u1', amount: 10 });
    await lockEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing amount', async () => {
    const { req, res, next } = mockReqResNext({ userId: 'u1', orderId: 'o1' });
    await lockEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('releaseEscrow validation', () => {
  it('should reject missing fields', async () => {
    const { req, res, next } = mockReqResNext({ escrowId: 'e1' });
    await releaseEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('refundEscrow validation', () => {
  it('should reject missing marketId', async () => {
    const { req, res, next } = mockReqResNext({});
    await refundEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('payout validation', () => {
  it('should reject missing marketId', async () => {
    const { req, res, next } = mockReqResNext({ winningOptionId: 'o1' });
    await payout(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing winningOptionId', async () => {
    const { req, res, next } = mockReqResNext({ marketId: 'm1' });
    await payout(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});
