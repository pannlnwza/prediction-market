import { Request, Response, NextFunction } from 'express';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { pushToUser, broadcastToMarket } from './socket';

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, type, title, message, referenceId } = req.body;

    if (!userId || !type || !title || !message) {
      throw new AppError(400, 'userId, type, title, and message are required', 'VALIDATION_ERROR');
    }

    const notification = await prisma.notification.create({
      data: { userId, type, title, message, referenceId },
    });

    // Push to user via WebSocket
    pushToUser(userId, 'notification', notification);

    // Also push updated unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });
    pushToUser(userId, 'notification:unread-count', { count: unreadCount });

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
}

export async function broadcastPriceUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId, options } = req.body;

    if (!marketId || !options) {
      throw new AppError(400, 'marketId and options are required', 'VALIDATION_ERROR');
    }

    broadcastToMarket(marketId, 'market:price-update', { marketId, options });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function broadcastOrderBookUpdate(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId, orderBook } = req.body;

    if (!marketId) {
      throw new AppError(400, 'marketId is required', 'VALIDATION_ERROR');
    }

    broadcastToMarket(marketId, 'market:orderbook-update', { marketId, orderBook });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function broadcastTradeEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId, trade } = req.body;

    if (!marketId || !trade) {
      throw new AppError(400, 'marketId and trade are required', 'VALIDATION_ERROR');
    }

    broadcastToMarket(marketId, 'market:trade', { marketId, trade });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notificationId = req.params.id as string;
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found', 'NOT_FOUND');
    }
    if (notification.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
