import { Request, Response, NextFunction } from 'express';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { createServiceClient } from '../../shared/service-client';

const walletService = createServiceClient(process.env.WALLET_SERVICE_URL || 'http://localhost:3003');
const notificationService = createServiceClient(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005');

export async function resolveMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const { winningOptionId, evidenceUrl, notes } = req.body;

    if (!winningOptionId) {
      throw new AppError(400, 'winningOptionId is required', 'VALIDATION_ERROR');
    }

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { options: true },
    });

    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }

    if (market.resolverId !== req.user!.id) {
      throw new AppError(403, 'You are not the assigned resolver for this market', 'FORBIDDEN');
    }

    if (market.status !== 'CLOSED' && market.status !== 'ACTIVE') {
      throw new AppError(400, 'Market cannot be resolved in its current state', 'INVALID_STATUS');
    }

    const validOption = market.options.find((o) => o.id === winningOptionId);
    if (!validOption) {
      throw new AppError(400, 'Invalid winning option for this market', 'INVALID_OPTION');
    }

    const resolution = await prisma.$transaction(async (tx) => {
      const created = await tx.resolution.create({
        data: {
          marketId,
          resolverId: req.user!.id,
          winningOptionId,
          evidenceUrl,
          notes,
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      await tx.market.update({
        where: { id: marketId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });

      return created;
    });

    try {
      await walletService.post('/api/wallet/payout', { marketId, winningOptionId });
    } catch (error) {
      console.error('Failed to trigger payout:', error);
    }

    try {
      await notificationService.post('/api/notifications', {
        userId: market.creatorId,
        type: 'MARKET_RESOLVED',
        title: 'Market Resolved',
        message: `Market "${market.title}" has been resolved. Winning outcome: ${validOption.label}`,
        referenceId: marketId,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    res.status(201).json(resolution);
  } catch (error) {
    next(error);
  }
}

export async function getResolution(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const resolution = await prisma.resolution.findUnique({
      where: { marketId },
      include: {
        winningOption: { select: { id: true, label: true } },
        resolver: { select: { id: true, displayName: true } },
      },
    });

    if (!resolution) {
      throw new AppError(404, 'Resolution not found', 'NOT_FOUND');
    }

    res.json(resolution);
  } catch (error) {
    next(error);
  }
}
