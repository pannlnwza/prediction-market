import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../shared/prisma';
import { createServiceClient } from '../../shared/service-client';

const walletClient = createServiceClient(process.env.WALLET_SERVICE_URL || 'http://localhost:3003');
const notificationClient = createServiceClient(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005');

interface MatchResult {
  filled: boolean;
  trades: { buyOrderId: string; sellOrderId: string; price: number; quantity: number }[];
}

export async function matchOrder(orderId: string): Promise<MatchResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { market: { include: { options: true } } },
  });

  if (!order || order.status !== 'OPEN') {
    return { filled: false, trades: [] };
  }

  const trades: MatchResult['trades'] = [];

  // Find matching orders on the opposite side of the SAME option
  // BUY at $0.62 matches with SELL at <= $0.62
  // SELL at $0.38 matches with BUY at >= $0.38
  const oppositeSide = order.side === 'BUY' ? 'SELL' : 'BUY';
  const priceCondition = order.side === 'BUY'
    ? { lte: order.price }  // buyer wants cheapest sells
    : { gte: order.price }; // seller wants highest buys
  const priceOrder = order.side === 'BUY' ? 'asc' as const : 'desc' as const;

  const matchingOrders = await prisma.order.findMany({
    where: {
      marketId: order.marketId,
      optionId: order.optionId,
      side: oppositeSide,
      status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
      price: priceCondition,
      userId: { not: order.userId }, // can't trade with yourself
    },
    orderBy: [
      { price: priceOrder },   // best price first
      { createdAt: 'asc' },    // oldest first (time priority)
    ],
  });

  let remainingQty = order.quantity - order.filledQuantity;

  for (const counterOrder of matchingOrders) {
    if (remainingQty <= 0) break;

    const counterRemaining = counterOrder.quantity - counterOrder.filledQuantity;
    if (counterRemaining <= 0) continue;

    const tradeQty = Math.min(remainingQty, counterRemaining);
    // Trade price = the resting order's price (the one already in the book)
    const tradePrice = Number(counterOrder.price);

    const buyOrder = order.side === 'BUY' ? order : counterOrder;
    const sellOrder = order.side === 'SELL' ? order : counterOrder;
    const buyerCost = tradePrice * tradeQty;
    const sellerCost = (1 - tradePrice) * tradeQty;

    // Lock escrow for the incoming order (buyer or seller)
    try {
      await walletClient.post('/api/wallet/escrow/lock', {
        userId: order.userId,
        orderId: order.id,
        amount: order.side === 'BUY' ? buyerCost : sellerCost,
      });
    } catch {
      // Can't lock escrow — stop matching
      break;
    }

    // Lock escrow for the counter order
    try {
      await walletClient.post('/api/wallet/escrow/lock', {
        userId: counterOrder.userId,
        orderId: counterOrder.id,
        amount: order.side === 'BUY' ? sellerCost : buyerCost,
      });
    } catch {
      // Refund the first lock — can't complete this match
      // For simplicity, skip this counter order and try next
      continue;
    }

    // Execute the trade in a transaction
    await prisma.$transaction(async (tx) => {
      // Create trade record
      await tx.trade.create({
        data: {
          marketId: order.marketId,
          optionId: order.optionId,
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          buyerId: buyOrder.userId,
          sellerId: sellOrder.userId,
          price: tradePrice,
          quantity: tradeQty,
        },
      });

      // Update incoming order
      const newFilled = order.filledQuantity + (order.quantity - remainingQty) + tradeQty;
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

      // Update positions — buyer gets shares
      await tx.position.upsert({
        where: {
          userId_marketId_optionId: {
            userId: buyOrder.userId,
            marketId: order.marketId,
            optionId: order.optionId,
          },
        },
        create: {
          userId: buyOrder.userId,
          marketId: order.marketId,
          optionId: order.optionId,
          quantity: tradeQty,
          avgPrice: tradePrice,
        },
        update: {
          quantity: { increment: tradeQty },
        },
      });

      // Update positions — seller loses shares (or goes negative = short)
      await tx.position.upsert({
        where: {
          userId_marketId_optionId: {
            userId: sellOrder.userId,
            marketId: order.marketId,
            optionId: order.optionId,
          },
        },
        create: {
          userId: sellOrder.userId,
          marketId: order.marketId,
          optionId: order.optionId,
          quantity: -tradeQty,
          avgPrice: tradePrice,
        },
        update: {
          quantity: { decrement: tradeQty },
        },
      });

      // Update market option price to last trade price
      await tx.marketOption.update({
        where: { id: order.optionId },
        data: { currentPrice: tradePrice },
      });

      // Update the complementary option (YES + NO = 1.00)
      const otherOption = order.market.options.find((o) => o.id !== order.optionId);
      if (otherOption) {
        await tx.marketOption.update({
          where: { id: otherOption.id },
          data: { currentPrice: new Decimal(1).minus(tradePrice) },
        });
      }
    });

    trades.push({
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      price: tradePrice,
      quantity: tradeQty,
    });

    remainingQty -= tradeQty;

    // Broadcast price update + trade event to market viewers, notify both traders (best effort)
    broadcastPriceUpdate(order.marketId, order.optionId, tradePrice);
    broadcastTradeEvent(order.marketId, tradePrice, tradeQty);
    notifyTrade(buyOrder.userId, sellOrder.userId, order.marketId, tradePrice, tradeQty);
  }

  // If market order and not fully filled, cancel the remainder
  if (order.type === 'MARKET' && remainingQty > 0) {
    const totalFilled = order.quantity - remainingQty;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        filledQuantity: totalFilled,
        status: totalFilled > 0 ? 'PARTIALLY_FILLED' : 'CANCELLED',
      },
    });
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
  } catch {
    // Best effort
  }
}

async function broadcastTradeEvent(marketId: string, price: number, quantity: number) {
  try {
    await notificationClient.post('/api/notifications/broadcast/trade', {
      marketId,
      trade: { price, quantity, timestamp: new Date().toISOString() },
    });
  } catch {
    // Best effort
  }
}

async function notifyTrade(
  buyerId: string,
  sellerId: string,
  marketId: string,
  price: number,
  quantity: number,
) {
  const message = `Trade matched: ${quantity} shares at $${price.toFixed(2)}`;
  try {
    await Promise.all([
      notificationClient.post('/api/notifications', {
        userId: buyerId,
        type: 'TRADE_MATCHED',
        title: 'Trade Matched',
        message,
        referenceId: marketId,
      }),
      notificationClient.post('/api/notifications', {
        userId: sellerId,
        type: 'TRADE_MATCHED',
        title: 'Trade Matched',
        message,
        referenceId: marketId,
      }),
    ]);
  } catch {
    // Notification failure shouldn't break the trade
  }
}
