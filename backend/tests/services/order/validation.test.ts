import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

// Mock prisma and service client before importing controller
vi.mock('../../../src/shared/prisma', () => ({
  default: {
    market: { findUnique: vi.fn() },
    marketOption: { findUnique: vi.fn() },
    order: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    escrow: { findMany: vi.fn().mockResolvedValue([]) },
    position: { findMany: vi.fn() },
    trade: { findMany: vi.fn() },
  },
}));

vi.mock('../../../src/shared/service-client', () => ({
  createServiceClient: () => ({
    post: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

vi.mock('../../../src/services/order/matching', () => ({
  matchOrder: vi.fn().mockResolvedValue({ filled: false, trades: [] }),
}));

import { placeOrder, cancelOrder, getOrder, listOrders, getOrderBook, getPortfolio, getTradeHistory } from '../../../src/services/order/controller';
import prisma from '../../../src/shared/prisma';

function mockReqResNext(body = {}, params = {}, user = { id: 'user-1', email: 'a@b.com', role: 'USER' }) {
  const req = { body, params, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('placeOrder validation', () => {
  it('should reject missing required fields', async () => {
    const { req, res, next } = mockReqResNext({});
    await placeOrder(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject price below 0.01', async () => {
    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('Price must be between');
  });

  it('should reject price above 0.99', async () => {
    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 1.0, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject quantity less than 1', async () => {
    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0.5, quantity: 0,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('required');
  });

  it('should reject non-existent market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({
      marketId: 'nonexistent', optionId: 'o1', price: 0.5, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('should reject inactive market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'CLOSED', closeDate: new Date('2020-01-01'),
    } as any);

    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0.5, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('MARKET_NOT_ACTIVE');
  });

  it('should reject expired market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', closeDate: new Date('2020-01-01'),
    } as any);

    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0.5, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('MARKET_NOT_ACTIVE');
  });

  it('should reject option not belonging to market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', closeDate: new Date('2030-01-01'),
    } as any);
    vi.mocked(prisma.marketOption.findUnique).mockResolvedValue({
      id: 'o1', marketId: 'different-market',
    } as any);

    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0.5, quantity: 1,
    });
    await placeOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_OPTION');
  });
});

describe('getOrder access control', () => {
  it('should reject access to another user\'s order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1', userId: 'other-user',
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'order-1' });
    await getOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should return 404 for non-existent order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'nonexistent' });
    await getOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });
});

describe('placeOrder - success', () => {
  it('should create order, lock escrow, and run matching', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', closeDate: new Date('2030-01-01'),
    } as any);
    vi.mocked(prisma.marketOption.findUnique).mockResolvedValue({
      id: 'o1', marketId: 'm1', label: 'YES',
    } as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'new-order', userId: 'user-1', marketId: 'm1', optionId: 'o1',
      price: 0.6, quantity: 5, status: 'OPEN', option: { label: 'YES' },
    } as any);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'new-order', status: 'OPEN', option: { label: 'YES' },
    } as any);

    const { req, res, next } = mockReqResNext({
      marketId: 'm1', optionId: 'o1', price: 0.6, quantity: 5,
    });
    await placeOrder(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 'new-order',
      matchResult: expect.objectContaining({ filled: false }),
    }));
  });
});

describe('getOrder - success', () => {
  it('should return own order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1', userId: 'user-1', status: 'OPEN', option: { label: 'YES' },
      market: { id: 'm1', title: 'Test', status: 'ACTIVE' },
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'order-1' });
    await getOrder(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
  });
});

describe('listOrders', () => {
  it('should return user orders', async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { id: 'o1', userId: 'user-1', status: 'OPEN', option: { label: 'YES' } },
    ] as any);

    const { req, res, next } = mockReqResNext();
    req.query = {} as any;
    await listOrders(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'o1' }),
    ]));
  });
});

describe('getOrderBook', () => {
  it('should return order book grouped by option and price', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', options: [{ id: 'yes-opt' }, { id: 'no-opt' }],
    } as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { optionId: 'yes-opt', price: { toString: () => '0.60' }, quantity: 10, filledQuantity: 0 },
      { optionId: 'yes-opt', price: { toString: () => '0.60' }, quantity: 5, filledQuantity: 0 },
      { optionId: 'no-opt', price: { toString: () => '0.40' }, quantity: 3, filledQuantity: 0 },
    ] as any);

    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await getOrderBook(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const response = (res.json as any).mock.calls[0][0];
    expect(response.orderBook['yes-opt']['0.60']).toBe(15);
    expect(response.orderBook['no-opt']['0.40']).toBe(3);
  });
});

describe('getPortfolio', () => {
  it('should return user positions', async () => {
    vi.mocked(prisma.position.findMany).mockResolvedValue([
      { id: 'p1', userId: 'user-1', quantity: 10, market: { title: 'Test' }, option: { label: 'YES' } },
    ] as any);

    const { req, res, next } = mockReqResNext();
    await getPortfolio(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'p1' }),
    ]));
  });
});

describe('getTradeHistory', () => {
  it('should return trade history for market', async () => {
    vi.mocked(prisma.trade.findMany).mockResolvedValue([
      { price: 0.6, quantity: 5, createdAt: new Date() },
      { price: 0.65, quantity: 3, createdAt: new Date() },
    ] as any);

    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await getTradeHistory(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ price: 0.6 }),
    ]));
  });
});

describe('cancelOrder - success', () => {
  it('should cancel open order and release escrow', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1', userId: 'user-1', status: 'OPEN',
    } as any);
    vi.mocked(prisma.order.update).mockResolvedValue({
      id: 'order-1', status: 'CANCELLED',
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'order-1' });
    await cancelOrder(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
  });
});

describe('cancelOrder validation', () => {
  beforeEach(() => {
    vi.mocked(prisma.order.findUnique).mockReset();
  });

  it('should reject cancelling a filled order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1', userId: 'user-1', status: 'FILLED',
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'order-1' });
    await cancelOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_STATUS');
  });

  it('should reject cancelling another user\'s order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1', userId: 'other-user', status: 'OPEN',
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'order-1' });
    await cancelOrder(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
  });
});
