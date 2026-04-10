import { Request, Response, NextFunction } from 'express';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { createServiceClient } from '../../shared/service-client';

const notificationClient = createServiceClient(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005');
const walletClient = createServiceClient(process.env.WALLET_SERVICE_URL || 'http://localhost:3003');

export async function listMarkets(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
      if (status === 'ACTIVE') {
        where.closeDate = { gt: new Date() };
      }
    }
    if (category && category !== 'All') where.category = category;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        include: {
          options: true,
          trades: { select: { price: true, quantity: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.market.count({ where }),
    ]);

    const marketsWithVolume = markets.map((m) => {
      const volume = m.trades.reduce((sum, t) => sum + Number(t.price) * t.quantity, 0);
      const { trades: _, ...market } = m;
      return { ...market, volume: Math.round(volume * 100) / 100 };
    });

    res.json({ markets: marketsWithVolume, total, limit, offset });
  } catch (error) {
    next(error);
  }
}

export async function getMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.id as string;
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        options: true,
        creator: { select: { id: true, displayName: true } },
        trades: { select: { price: true, quantity: true } },
      },
    });

    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }

    const volume = market.trades.reduce((sum, t) => sum + Number(t.price) * t.quantity, 0);
    const { trades: _, ...marketData } = market;
    res.json({ ...marketData, volume: Math.round(volume * 100) / 100 });
  } catch (error) {
    next(error);
  }
}

export async function createMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, category, closeDate, resolverId } = req.body;

    if (!title || !closeDate) {
      throw new AppError(400, 'Title and closeDate are required', 'VALIDATION_ERROR');
    }

    const market = await prisma.market.create({
      data: {
        title,
        description,
        category: category || 'General',
        closeDate: new Date(closeDate),
        creatorId: req.user!.id,
        resolverId,
        options: {
          create: [
            { label: 'YES', currentPrice: 0.5 },
            { label: 'NO', currentPrice: 0.5 },
          ],
        },
      },
      include: { options: true },
    });

    res.status(201).json(market);

    // Notify all users about new market (best effort, don't await in response)
    notificationClient.post('/api/notifications', {
      userId: req.user!.id,
      type: 'MARKET_CREATED',
      title: 'New Market Created',
      message: `New market: "${title}"`,
      referenceId: market.id,
    }).catch(() => {});
  } catch (error) {
    next(error);
  }
}

export async function updateMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, closeDate, resolverId, status } = req.body;

    const marketId = req.params.id as string;
    const market = await prisma.market.findUnique({ where: { id: marketId } });
    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }

    const updated = await prisma.market.update({
      where: { id: marketId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(closeDate !== undefined && { closeDate: new Date(closeDate) }),
        ...(resolverId !== undefined && { resolverId }),
        ...(status !== undefined && { status }),
      },
      include: { options: true },
    });

    // If market is being voided, refund all escrows and notify
    if (status === 'VOIDED') {
      walletClient.post('/api/wallet/escrow/refund', { marketId }).catch(() => {});
      notificationClient.post('/api/notifications', {
        userId: market.creatorId,
        type: 'MARKET_VOIDED',
        title: 'Market Voided',
        message: `Market "${market.title}" has been voided. All funds will be refunded.`,
        referenceId: marketId,
      }).catch(() => {});
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.id as string;
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { trades: { take: 1 } },
    });

    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }

    if (market.trades.length > 0) {
      throw new AppError(400, 'Cannot delete market with existing trades', 'HAS_TRADES');
    }

    await prisma.$transaction([
      prisma.marketOption.deleteMany({ where: { marketId: market.id } }),
      prisma.order.deleteMany({ where: { marketId: market.id } }),
      prisma.market.delete({ where: { id: market.id } }),
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN', 'RESOLVER'].includes(role)) {
      throw new AppError(400, 'Valid role is required (USER, ADMIN, RESOLVER)', 'VALIDATION_ERROR');
    }

    const userId = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, displayName: true, role: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}
