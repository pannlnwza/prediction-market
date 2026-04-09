import { Request, Response, NextFunction } from 'express';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { createServiceClient } from '../../shared/service-client';
import { matchOrder } from './matching';

const walletClient = createServiceClient(process.env.WALLET_SERVICE_URL || 'http://localhost:3003');

export async function placeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId, optionId, type, side, price, quantity } = req.body;

    if (!marketId || !optionId || !type || !side || price === undefined || !quantity) {
      throw new AppError(400, 'marketId, optionId, type, side, price, and quantity are required', 'VALIDATION_ERROR');
    }

    if (price < 0.01 || price > 0.99) {
      throw new AppError(400, 'Price must be between 0.01 and 0.99', 'VALIDATION_ERROR');
    }

    if (quantity < 1) {
      throw new AppError(400, 'Quantity must be at least 1', 'VALIDATION_ERROR');
    }

    const market = await prisma.market.findUnique({ where: { id: marketId } });
    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }
    if (market.status !== 'ACTIVE') {
      throw new AppError(400, 'Market is not active', 'MARKET_NOT_ACTIVE');
    }

    const option = await prisma.marketOption.findUnique({ where: { id: optionId } });
    if (!option || option.marketId !== marketId) {
      throw new AppError(400, 'Invalid option for this market', 'INVALID_OPTION');
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        marketId,
        optionId,
        type,
        side,
        price,
        quantity,
      },
      include: { option: true },
    });

    // Run matching engine
    const matchResult = await matchOrder(order.id);

    // Refetch order to get updated status
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { option: true },
    });

    res.status(201).json({
      ...updatedOrder,
      matchResult: {
        filled: matchResult.filled,
        tradesCount: matchResult.trades.length,
        trades: matchResult.trades,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.query.marketId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (marketId) where.marketId = marketId;
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { option: true, market: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { option: true, market: { select: { id: true, title: true, status: true } } },
    });

    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }
    if (order.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new AppError(404, 'Order not found', 'NOT_FOUND');
    }
    if (order.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }
    if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_FILLED') {
      throw new AppError(400, 'Only open or partially filled orders can be cancelled', 'INVALID_STATUS');
    }

    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    // Release any locked escrow for this order (best effort)
    try {
      const escrows = await prisma.escrow.findMany({
        where: { orderId: order.id, status: 'LOCKED' },
      });
      for (const escrow of escrows) {
        await walletClient.post('/api/wallet/escrow/release', {
          escrowId: escrow.id,
          winnerUserId: order.userId,
          amount: Number(escrow.amount),
        });
      }
    } catch {
      // Escrow release failure logged but doesn't block cancellation
    }

    res.json(cancelled);
  } catch (error) {
    next(error);
  }
}

export async function getOrderBook(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.id as string;

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { options: true },
    });

    if (!market) {
      throw new AppError(404, 'Market not found', 'NOT_FOUND');
    }

    const openOrders = await prisma.order.findMany({
      where: { marketId, status: 'OPEN' },
      select: { optionId: true, side: true, price: true, quantity: true, filledQuantity: true },
    });

    const orderBook: Record<string, { buy: Record<string, number>; sell: Record<string, number> }> = {};

    for (const option of market.options) {
      orderBook[option.id] = { buy: {}, sell: {} };
    }

    for (const order of openOrders) {
      const remaining = order.quantity - order.filledQuantity;
      if (remaining <= 0) continue;

      const priceKey = order.price.toString();
      const sideBook = orderBook[order.optionId]?.[order.side === 'BUY' ? 'buy' : 'sell'];
      if (sideBook) {
        sideBook[priceKey] = (sideBook[priceKey] || 0) + remaining;
      }
    }

    res.json({ marketId, options: market.options, orderBook });
  } catch (error) {
    next(error);
  }
}

export async function getPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const positions = await prisma.position.findMany({
      where: { userId: req.user!.id, quantity: { gt: 0 } },
      include: {
        market: { select: { id: true, title: true, status: true } },
        option: { select: { id: true, label: true, currentPrice: true } },
      },
    });

    res.json(positions);
  } catch (error) {
    next(error);
  }
}

export async function getMarketPosition(req: Request, res: Response, next: NextFunction) {
  try {
    const marketId = req.params.marketId as string;
    const positions = await prisma.position.findMany({
      where: { userId: req.user!.id, marketId },
      include: {
        option: { select: { id: true, label: true, currentPrice: true } },
      },
    });

    res.json(positions);
  } catch (error) {
    next(error);
  }
}
