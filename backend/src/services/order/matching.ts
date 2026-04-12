import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../shared/prisma';
import { createServiceClient } from '../../shared/service-client';

const notificationClient = createServiceClient(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005');

interface MatchResult {
  filled: boolean;
  trades: { yesOrderId: string; noOrderId: string; price: number; quantity: number }[];
}

/**
 * Matching for binary markets:
 * - Users only BUY YES or BUY NO
 * - BUY YES at 0.60 matches with BUY NO at 0.40 (prices sum to 1.00)
 * - The YES buyer pays their price, the NO buyer pays their price
 * - On resolution: winner gets 1.00 per share, loser gets 0.00
 */
export async function matchOrder(orderId: string): Promise<MatchResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { market: { include: { options: true } } },
  });

  if (!order || order.status !== 'OPEN') {
    return { filled: false, trades: [] };
  }

  const trades: MatchResult['trades'] = [];

  // Find the complementary option (YES ↔ NO)
  const complementaryOption = order.market.options.find((o) => o.id !== order.optionId);
  if (!complementaryOption) {
    return { filled: false, trades: [] };
  }

  // if I buy YES at 0.60, I need someone buying NO at 0.40
  const complementaryPrice = new Decimal(1).minus(order.price);

  // Find matching orders: people who bought the OTHER option at a price
  // where their price >= complementaryPrice (they're willing to pay at least what we need)
  const matchingOrders = await prisma.order.findMany({
    where: {
      marketId: order.marketId,
      optionId: complementaryOption.id,
      status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
      price: { gte: complementaryPrice },
      userId: { not: order.userId },
    },
    orderBy: [
      { price: 'desc' },     // highest price first (best match)
      { createdAt: 'asc' },  // oldest first (time priority)
    ],
  });

  let remainingQty = order.quantity - order.filledQuantity;

  for (const counterOrder of matchingOrders) {
    if (remainingQty <= 0) break;

    const counterRemaining = counterOrder.quantity - counterOrder.filledQuantity;
    if (counterRemaining <= 0) continue;

    const tradeQty = Math.min(remainingQty, counterRemaining);

    // Each side pays their own price (escrow already locked at order placement)
    const myPrice = Number(order.price);
    const theirPrice = Number(counterOrder.price);

    // The trade price is the YES price (used for price display)
    // If I bought YES, my price is the trade price
    // If I bought NO, the trade price is 1 - my price
    const yesOption = order.market.options.find((o) => o.label === 'YES');
    const isMyOrderYes = order.optionId === yesOption?.id;
    const tradePrice = isMyOrderYes ? myPrice : theirPrice;

    // Determine which order is YES and which is NO
    const yesOrderId = isMyOrderYes ? order.id : counterOrder.id;
    const noOrderId = isMyOrderYes ? counterOrder.id : order.id;
    const yesUserId = isMyOrderYes ? order.userId : counterOrder.userId;
    const noUserId = isMyOrderYes ? counterOrder.userId : order.userId;
    const yesOptionId = isMyOrderYes ? order.optionId : counterOrder.optionId;
    const noOptionId = isMyOrderYes ? counterOrder.optionId : order.optionId;

    // Execute the trade
    await prisma.$transaction(async (tx) => {
      await tx.trade.create({
        data: {
          marketId: order.marketId,
          optionId: yesOptionId,
          yesOrderId,
          noOrderId,
          yesUserId,
          noUserId,
          price: tradePrice,
          quantity: tradeQty,
        },
      });

      // Update incoming order
      const newFilled = order.quantity - remainingQty + tradeQty;
      await tx.order.update({
        where: { id: order.id },
        data: {
          filledQuantity: newFilled,
          status: newFilled >= order.quantity ? 'FILLED' : 'PARTIALLY_FILLED',
        },
      });

      // Update counter order
      const counterNewFilled = counterOrder.filledQuantity + tradeQty;
      await tx.order.update({
        where: { id: counterOrder.id },
        data: {
          filledQuantity: counterNewFilled,
          status: counterNewFilled >= counterOrder.quantity ? 'FILLED' : 'PARTIALLY_FILLED',
        },
      });

      // YES buyer gets YES shares
      await tx.position.upsert({
        where: {
          userId_marketId_optionId: {
            userId: yesUserId,
            marketId: order.marketId,
            optionId: yesOptionId,
          },
        },
        create: {
          userId: yesUserId,
          marketId: order.marketId,
          optionId: yesOptionId,
          quantity: tradeQty,
          avgPrice: tradePrice,
        },
        update: { quantity: { increment: tradeQty } },
      });

      // NO buyer gets NO shares
      await tx.position.upsert({
        where: {
          userId_marketId_optionId: {
            userId: noUserId,
            marketId: order.marketId,
            optionId: noOptionId,
          },
        },
        create: {
          userId: noUserId,
          marketId: order.marketId,
          optionId: noOptionId,
          quantity: tradeQty,
          avgPrice: 1 - tradePrice,
        },
        update: { quantity: { increment: tradeQty } },
      });

      // YES price = last trade price, NO = 1 - YES
      await tx.marketOption.update({
        where: { id: yesOptionId },
        data: { currentPrice: tradePrice },
      });
      await tx.marketOption.update({
        where: { id: noOptionId },
        data: { currentPrice: new Decimal(1).minus(tradePrice) },
      });
    });

    trades.push({
      yesOrderId,
      noOrderId,
      price: tradePrice,
      quantity: tradeQty,
    });

    remainingQty -= tradeQty;

    // Broadcast and notify (best effort)
    broadcastPriceUpdate(order.marketId, yesOptionId, tradePrice);
    broadcastTradeEvent(order.marketId, tradePrice, tradeQty);
    notifyTrade(yesUserId, noUserId, order.marketId, tradePrice, tradeQty);
  }

  return { filled: remainingQty <= 0, trades };
}

async function broadcastPriceUpdate(marketId: string, optionId: string, tradePrice: number) {
  try {
    await notificationClient.post('/api/notifications/broadcast/price', {
      marketId,
      options: [
        { id: optionId, currentPrice: tradePrice },
        { complementary: true, currentPrice: 1 - tradePrice },
      ],
    });
  } catch {}
}

async function broadcastTradeEvent(marketId: string, price: number, quantity: number) {
  try {
    await notificationClient.post('/api/notifications/broadcast/trade', {
      marketId,
      trade: { price, quantity, timestamp: new Date().toISOString() },
    });
  } catch {}
}

async function notifyTrade(
  yesUserId: string,
  noUserId: string,
  marketId: string,
  price: number,
  quantity: number,
) {
  const message = `Trade matched: ${quantity} shares at $${price.toFixed(2)}`;
  try {
    await Promise.all([
      notificationClient.post('/api/notifications', {
        userId: yesUserId,
        type: 'TRADE_MATCHED',
        title: 'Trade Matched: You bought YES',
        message,
        referenceId: marketId,
      }),
      notificationClient.post('/api/notifications', {
        userId: noUserId,
        type: 'TRADE_MATCHED',
        title: 'Trade Matched: You bought NO',
        message,
        referenceId: marketId,
      }),
    ]);
  } catch {}
}
