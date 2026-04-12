import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    market: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    marketOption: { createMany: vi.fn(), deleteMany: vi.fn() },
    order: { deleteMany: vi.fn() },
    trade: { count: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((arr: any) => Promise.resolve()),
  },
}));

vi.mock('../../../src/shared/service-client', () => ({
  createServiceClient: () => ({
    post: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

import { createMarket, getMarket, updateMarket, deleteMarket, updateUserRole, listMarkets, listUsers } from '../../../src/services/market/controller';
import prisma from '../../../src/shared/prisma';

function mockReqResNext(body = {}, params = {}, user = { id: 'admin-1', email: 'a@b.com', role: 'ADMIN' }) {
  const req = { body, params, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createMarket', () => {
  it('should reject missing title', async () => {
    const { req, res, next } = mockReqResNext({ closeDate: '2030-01-01' });
    await createMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing closeDate', async () => {
    const { req, res, next } = mockReqResNext({ title: 'Test Market' });
    await createMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('getMarket', () => {
  it('should return 404 for non-existent market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'nonexistent' });
    await getMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('updateMarket', () => {
  it('should return 404 for non-existent market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ status: 'VOIDED' }, { id: 'nonexistent' });
    await updateMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });

  it('should reject voiding a resolved market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'RESOLVED', creatorId: 'admin-1',
    } as any);

    const { req, res, next } = mockReqResNext({ status: 'VOIDED' }, { id: 'm1' });
    await updateMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_STATUS');
  });

  it('should reject voiding an already voided market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'VOIDED', creatorId: 'admin-1',
    } as any);

    const { req, res, next } = mockReqResNext({ status: 'VOIDED' }, { id: 'm1' });
    await updateMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_STATUS');
  });
});

describe('deleteMarket', () => {
  it('should return 404 for non-existent market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'nonexistent' });
    await deleteMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });

  it('should reject deleting market with trades', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({ id: 'm1', trades: [{ id: 't1' }] } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await deleteMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('HAS_TRADES');
  });
});

describe('listMarkets', () => {
  it('should return markets with volume and pagination', async () => {
    vi.mocked(prisma.market.findMany).mockResolvedValue([
      { id: 'm1', title: 'Test', trades: [{ price: 0.5, quantity: 10 }], options: [] },
    ] as any);
    vi.mocked(prisma.market.count).mockResolvedValue(1);

    const { req, res, next } = mockReqResNext({}, {}, { id: 'u1', email: 'a@b.com', role: 'USER' });
    req.query = {} as any;
    await listMarkets(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      markets: expect.arrayContaining([
        expect.objectContaining({ id: 'm1', volume: 5 }),
      ]),
      total: 1,
    }));
  });
});

describe('getMarket - success', () => {
  it('should return market with volume', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', title: 'Test', options: [], trades: [{ price: 0.6, quantity: 5 }],
      creator: { id: 'u1', displayName: 'Admin' },
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await getMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1', volume: 3 }));
  });
});

describe('createMarket - success', () => {
  it('should create market with YES/NO options', async () => {
    vi.mocked(prisma.market.create).mockResolvedValue({
      id: 'new-m', title: 'New Market', options: [
        { id: 'o1', label: 'YES' },
        { id: 'o2', label: 'NO' },
      ],
    } as any);

    const { req, res, next } = mockReqResNext({
      title: 'New Market', closeDate: '2030-01-01',
    });
    await createMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.market.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'New Market',
        options: { create: [
          { label: 'YES', currentPrice: 0.5 },
          { label: 'NO', currentPrice: 0.5 },
        ]},
      }),
    }));
  });
});

describe('updateMarket - success', () => {
  it('should update market fields', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({ id: 'm1', status: 'ACTIVE', creatorId: 'admin-1' } as any);
    vi.mocked(prisma.market.update).mockResolvedValue({ id: 'm1', title: 'Updated', options: [] } as any);

    const { req, res, next } = mockReqResNext({ title: 'Updated' }, { id: 'm1' });
    await updateMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
  });
});

describe('deleteMarket - success', () => {
  it('should delete market without trades', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({ id: 'm1', trades: [] } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await deleteMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe('listUsers', () => {
  it('should return users list', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u1', email: 'a@b.com', displayName: 'Test', role: 'USER', createdAt: new Date() },
    ] as any);

    const { req, res, next } = mockReqResNext();
    await listUsers(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'u1' }),
    ]));
  });
});

describe('updateUserRole - success', () => {
  it('should update user role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', role: 'USER' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1', email: 'a@b.com', displayName: 'Test', role: 'ADMIN' } as any);

    const { req, res, next } = mockReqResNext({ role: 'ADMIN' }, { id: 'u1' });
    await updateUserRole(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ role: 'ADMIN' }));
  });
});

describe('updateUserRole', () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it('should reject missing role', async () => {
    const { req, res, next } = mockReqResNext({}, { id: 'user-1' });
    await updateUserRole(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid role value', async () => {
    const { req, res, next } = mockReqResNext({ role: 'SUPERADMIN' }, { id: 'user-1' });
    await updateUserRole(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should return 404 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ role: 'ADMIN' }, { id: 'nonexistent' });
    await updateUserRole(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });
});
