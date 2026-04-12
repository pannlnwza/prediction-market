import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../../src/services/notification/socket', () => ({
  pushToUser: vi.fn(),
  broadcastToMarket: vi.fn(),
}));

import {
  createNotification,
  broadcastPriceUpdate,
  broadcastTradeEvent,
  broadcastOrderBookUpdate,
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../../../src/services/notification/controller';
import prisma from '../../../src/shared/prisma';
import { pushToUser, broadcastToMarket } from '../../../src/services/notification/socket';

function mockReqResNext(body = {}, params = {}, user = { id: 'user-1', email: 'a@b.com', role: 'USER' }) {
  const req = { body, params, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createNotification', () => {
  it('should reject missing userId', async () => {
    const { req, res, next } = mockReqResNext({ type: 'TEST', title: 'Hi', message: 'Msg' });
    await createNotification(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing type', async () => {
    const { req, res, next } = mockReqResNext({ userId: 'u1', title: 'Hi', message: 'Msg' });
    await createNotification(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing title', async () => {
    const { req, res, next } = mockReqResNext({ userId: 'u1', type: 'TEST', message: 'Msg' });
    await createNotification(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing message', async () => {
    const { req, res, next } = mockReqResNext({ userId: 'u1', type: 'TEST', title: 'Hi' });
    await createNotification(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('broadcastPriceUpdate', () => {
  it('should reject missing marketId', async () => {
    const { req, res, next } = mockReqResNext({ options: [] });
    await broadcastPriceUpdate(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing options', async () => {
    const { req, res, next } = mockReqResNext({ marketId: 'm1' });
    await broadcastPriceUpdate(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('broadcastTradeEvent', () => {
  it('should reject missing marketId', async () => {
    const { req, res, next } = mockReqResNext({ trade: {} });
    await broadcastTradeEvent(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  it('should reject missing trade', async () => {
    const { req, res, next } = mockReqResNext({ marketId: 'm1' });
    await broadcastTradeEvent(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('broadcastOrderBookUpdate', () => {
  it('should reject missing marketId', async () => {
    const { req, res, next } = mockReqResNext({});
    await broadcastOrderBookUpdate(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });
});

describe('createNotification - success', () => {
  it('should create notification and push via WebSocket', async () => {
    vi.mocked(prisma.notification.create).mockResolvedValue({
      id: 'n1', userId: 'u1', type: 'TRADE_MATCHED', title: 'Trade', message: 'Matched', read: false,
    } as any);
    vi.mocked(prisma.notification.count).mockResolvedValue(3);

    const { req, res, next } = mockReqResNext({
      userId: 'u1', type: 'TRADE_MATCHED', title: 'Trade', message: 'Matched',
    });
    await createNotification(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(pushToUser).toHaveBeenCalledWith('u1', 'notification', expect.objectContaining({ id: 'n1' }));
    expect(pushToUser).toHaveBeenCalledWith('u1', 'notification:unread-count', { count: 3 });
  });
});

describe('broadcastPriceUpdate - success', () => {
  it('should broadcast price update to market room', async () => {
    const { req, res, next } = mockReqResNext({
      marketId: 'm1', options: [{ id: 'o1', currentPrice: 0.65 }],
    });
    await broadcastPriceUpdate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(broadcastToMarket).toHaveBeenCalledWith('m1', 'market:price-update', expect.objectContaining({ marketId: 'm1' }));
  });
});

describe('broadcastTradeEvent - success', () => {
  it('should broadcast trade event to market room', async () => {
    const { req, res, next } = mockReqResNext({
      marketId: 'm1', trade: { price: 0.6, quantity: 5 },
    });
    await broadcastTradeEvent(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(broadcastToMarket).toHaveBeenCalledWith('m1', 'market:trade', expect.objectContaining({ marketId: 'm1' }));
  });
});

describe('broadcastOrderBookUpdate - success', () => {
  it('should broadcast orderbook update', async () => {
    const { req, res, next } = mockReqResNext({ marketId: 'm1', orderBook: {} });
    await broadcastOrderBookUpdate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('listNotifications', () => {
  it('should return user notifications', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([
      { id: 'n1', userId: 'user-1', type: 'TRADE_MATCHED', title: 'Trade', message: 'Matched', read: false },
    ] as any);

    const { req, res, next } = mockReqResNext();
    req.query = {} as any;
    await listNotifications(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'n1' }),
    ]));
  });
});

describe('markAsRead - success', () => {
  it('should mark own notification as read', async () => {
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({ id: 'n1', userId: 'user-1' } as any);
    vi.mocked(prisma.notification.update).mockResolvedValue({ id: 'n1', userId: 'user-1', read: true } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'n1' });
    await markAsRead(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ read: true }));
  });
});

describe('markAllAsRead', () => {
  it('should mark all user notifications as read', async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 } as any);

    const { req, res, next } = mockReqResNext();
    await markAllAsRead(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    });
  });
});

describe('markAsRead', () => {
  it('should return 404 for non-existent notification', async () => {
    vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'nonexistent' });
    await markAsRead(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
  });

  it('should reject marking another user\'s notification', async () => {
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'n1', userId: 'other-user',
    } as any);

    const { req, res, next } = mockReqResNext({}, { id: 'n1' });
    await markAsRead(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});
