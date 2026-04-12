import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

// Deep mock for $transaction that passes a tx object to the callback
let mockTxFns: Record<string, any>;

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    transaction: { create: vi.fn(), findMany: vi.fn() },
    escrow: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    order: { findMany: vi.fn() },
    position: { findMany: vi.fn() },
    $transaction: vi.fn((cb: any) => {
      if (typeof cb === 'function') return cb(mockTxFns);
      return Promise.resolve();
    }),
  },
}));

import { lockEscrow, releaseEscrow, refundEscrow, payout, deposit, withdraw } from '../../../src/services/wallet/controller';
import prisma from '../../../src/shared/prisma';

function mockReqResNext(body = {}, user = { id: 'user-1', email: 'a@b.com', role: 'USER' }) {
  const req = { body, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTxFns = {
    wallet: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'w1', balance: new Decimal(100) }),
    },
    transaction: { create: vi.fn().mockResolvedValue({}) },
    escrow: {
      create: vi.fn().mockResolvedValue({ id: 'e1' }),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    order: { findMany: vi.fn().mockResolvedValue([]) },
    position: { findMany: vi.fn().mockResolvedValue([]) },
  };
});

describe('deposit', () => {
  it('should deposit and return new balance', async () => {
    const { req, res, next } = mockReqResNext({ amount: 50 });
    await deposit(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ balance: new Decimal(100) });
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { balance: { increment: 50 } },
    });
    expect(mockTxFns.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'DEPOSIT', amount: 50 }),
    });
  });
});

describe('withdraw', () => {
  it('should withdraw and return new balance', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: new Decimal(200) });

    const { req, res, next } = mockReqResNext({ amount: 50 });
    await withdraw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { balance: { decrement: 50 } },
    });
    expect(mockTxFns.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'WITHDRAWAL', amount: 50 }),
    });
  });

  it('should reject withdrawal exceeding balance', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: new Decimal(10) });

    const { req, res, next } = mockReqResNext({ amount: 100 });
    await withdraw(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('should reject if wallet not found', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ amount: 10 });
    await withdraw(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });
});

describe('lockEscrow', () => {
  it('should lock escrow: deduct balance, create escrow, log transaction', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: new Decimal(100) });

    const { req, res, next } = mockReqResNext({ userId: 'user-1', orderId: 'order-1', amount: 30 });
    await lockEscrow(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);

    // Balance decremented
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { balance: { decrement: 30 } },
    });

    // Escrow record created
    expect(mockTxFns.escrow.create).toHaveBeenCalledWith({
      data: { walletId: 'w1', orderId: 'order-1', amount: 30 },
    });

    // Transaction logged
    expect(mockTxFns.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'ESCROW_LOCK', amount: 30 }),
    });
  });

  it('should reject escrow if insufficient balance', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue({ id: 'w1', balance: new Decimal(5) });

    const { req, res, next } = mockReqResNext({ userId: 'user-1', orderId: 'order-1', amount: 30 });
    await lockEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('should reject escrow if wallet not found', async () => {
    mockTxFns.wallet.findUnique.mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ userId: 'no-user', orderId: 'order-1', amount: 10 });
    await lockEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });
});

describe('releaseEscrow', () => {
  it('should release escrow: mark released, credit winner, log transaction', async () => {
    mockTxFns.escrow.findUnique.mockResolvedValue({ id: 'e1', status: 'LOCKED', amount: new Decimal(50) });
    mockTxFns.wallet.findUnique.mockResolvedValue({ id: 'w-winner' });

    const { req, res, next } = mockReqResNext({ escrowId: 'e1', winnerUserId: 'winner', amount: 50 });
    await releaseEscrow(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });

    // Escrow marked as released
    expect(mockTxFns.escrow.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'RELEASED' },
    });

    // Winner balance incremented
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { userId: 'winner' },
      data: { balance: { increment: 50 } },
    });

    // Transaction logged
    expect(mockTxFns.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'ESCROW_RELEASE', amount: 50 }),
    });
  });

  it('should reject if escrow not found', async () => {
    mockTxFns.escrow.findUnique.mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ escrowId: 'bad', winnerUserId: 'u1', amount: 10 });
    await releaseEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_ESCROW');
  });

  it('should reject if escrow already released', async () => {
    mockTxFns.escrow.findUnique.mockResolvedValue({ id: 'e1', status: 'RELEASED' });

    const { req, res, next } = mockReqResNext({ escrowId: 'e1', winnerUserId: 'u1', amount: 10 });
    await releaseEscrow(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_ESCROW');
  });
});

describe('refundEscrow', () => {
  it('should refund all locked escrows for a market', async () => {
    mockTxFns.order.findMany.mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]);
    mockTxFns.escrow.findMany.mockResolvedValue([
      { id: 'e1', walletId: 'w1', amount: new Decimal(30), wallet: { id: 'w1' } },
      { id: 'e2', walletId: 'w2', amount: new Decimal(20), wallet: { id: 'w2' } },
    ]);

    const { req, res, next } = mockReqResNext({ marketId: 'm1' });
    await refundEscrow(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });

    // Both wallets credited
    expect(mockTxFns.wallet.update).toHaveBeenCalledTimes(2);

    // Both escrows marked REFUNDED
    expect(mockTxFns.escrow.update).toHaveBeenCalledTimes(2);
    expect(mockTxFns.escrow.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'REFUNDED' },
    });

    // Both transactions logged as REFUND
    expect(mockTxFns.transaction.create).toHaveBeenCalledTimes(2);
  });
});

describe('payout', () => {
  it('should pay $1.00 per share to winning position holders', async () => {
    mockTxFns.position.findMany.mockResolvedValue([
      {
        marketId: 'm1', optionId: 'yes-opt', quantity: 10,
        user: { id: 'alice', wallet: { id: 'w-alice' } },
      },
      {
        marketId: 'm1', optionId: 'yes-opt', quantity: 5,
        user: { id: 'bob', wallet: { id: 'w-bob' } },
      },
    ]);
    mockTxFns.order.findMany.mockResolvedValue([{ id: 'o1' }]);

    const { req, res, next } = mockReqResNext({ marketId: 'm1', winningOptionId: 'yes-opt' });
    await payout(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });

    // Alice gets $10 (10 shares * $1.00)
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { id: 'w-alice' },
      data: { balance: { increment: new Decimal(10) } },
    });

    // Bob gets $5 (5 shares * $1.00)
    expect(mockTxFns.wallet.update).toHaveBeenCalledWith({
      where: { id: 'w-bob' },
      data: { balance: { increment: new Decimal(5) } },
    });

    // 2 payout transactions logged
    expect(mockTxFns.transaction.create).toHaveBeenCalledTimes(2);

    // All escrows released
    expect(mockTxFns.escrow.updateMany).toHaveBeenCalledWith({
      where: { orderId: { in: ['o1'] }, status: 'LOCKED' },
      data: { status: 'RELEASED' },
    });
  });

  it('should skip users without a wallet', async () => {
    mockTxFns.position.findMany.mockResolvedValue([
      {
        marketId: 'm1', optionId: 'yes-opt', quantity: 5,
        user: { id: 'alice', wallet: null },
      },
    ]);
    mockTxFns.order.findMany.mockResolvedValue([]);

    const { req, res, next } = mockReqResNext({ marketId: 'm1', winningOptionId: 'yes-opt' });
    await payout(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockTxFns.wallet.update).not.toHaveBeenCalled();
    expect(mockTxFns.transaction.create).not.toHaveBeenCalled();
  });
});
