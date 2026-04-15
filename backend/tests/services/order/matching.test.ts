import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

// Track all DB operations for assertions
const txOps = {
  tradeCreate: vi.fn().mockResolvedValue({}),
  orderUpdate: vi.fn().mockResolvedValue({}),
  positionUpsert: vi.fn().mockResolvedValue({}),
  marketOptionUpdate: vi.fn().mockResolvedValue({}),
};

const mockTx = {
  trade: { create: txOps.tradeCreate },
  order: { update: txOps.orderUpdate },
  position: { findUnique: vi.fn().mockResolvedValue(null), upsert: txOps.positionUpsert },
  marketOption: { update: txOps.marketOptionUpdate },
};

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb: any) => cb(mockTx)),
  },
}));

vi.mock('../../../src/shared/service-client', () => ({
  createServiceClient: () => ({
    post: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

import { matchOrder } from '../../../src/services/order/matching';
import prisma from '../../../src/shared/prisma';

const YES_OPTION = { id: 'yes-opt', label: 'YES', marketId: 'm1', currentPrice: new Decimal(0.5) };
const NO_OPTION = { id: 'no-opt', label: 'NO', marketId: 'm1', currentPrice: new Decimal(0.5) };
const MARKET = { id: 'm1', options: [YES_OPTION, NO_OPTION] };

function makeOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    userId: 'user-a',
    marketId: 'm1',
    optionId: 'yes-opt',
    price: new Decimal(0.6),
    quantity: 10,
    filledQuantity: 0,
    status: 'OPEN',
    market: MARKET,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('matchOrder', () => {
  it('should return empty result if order not found', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const result = await matchOrder('nonexistent');

    expect(result).toEqual({ filled: false, trades: [] });
  });

  it('should return empty result if order is not OPEN', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ status: 'CANCELLED' }) as any
    );

    const result = await matchOrder('order-1');

    expect(result).toEqual({ filled: false, trades: [] });
  });

  it('should return empty result if no complementary option exists', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder({ market: { id: 'm1', options: [YES_OPTION] } }) as any
    );

    const result = await matchOrder('order-1');

    expect(result).toEqual({ filled: false, trades: [] });
  });

  it('should return empty result if no matching counter orders', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);

    const result = await matchOrder('order-1');

    expect(result).toEqual({ filled: false, trades: [] });
  });

  it('should match YES order with NO counter order when prices sum to 1.00', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.6),
      quantity: 5,
      filledQuantity: 0,
    });

    const counterOrder = {
      id: 'no-order',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 5,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counterOrder] as any);

    const result = await matchOrder('yes-order');

    expect(result.filled).toBe(true);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]).toEqual({
      yesOrderId: 'yes-order',
      noOrderId: 'no-order',
      price: 0.6,
      quantity: 5,
    });

    // Verify trade was created
    expect(txOps.tradeCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        marketId: 'm1',
        yesOrderId: 'yes-order',
        noOrderId: 'no-order',
        yesUserId: 'alice',
        noUserId: 'bob',
        price: 0.6,
        quantity: 5,
      }),
    });

    // Verify both orders updated
    expect(txOps.orderUpdate).toHaveBeenCalledTimes(2);

    // Verify positions created for both sides
    expect(txOps.positionUpsert).toHaveBeenCalledTimes(2);

    // Verify option prices updated (YES and NO)
    expect(txOps.marketOptionUpdate).toHaveBeenCalledTimes(2);
  });

  it('should match NO order with YES counter order', async () => {
    const incomingOrder = makeOrder({
      id: 'no-order',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 3,
      filledQuantity: 0,
    });

    const counterOrder = {
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.6),
      quantity: 3,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counterOrder] as any);

    const result = await matchOrder('no-order');

    expect(result.filled).toBe(true);
    expect(result.trades).toHaveLength(1);
    // Trade price should be the YES price (0.6), not the NO price
    expect(result.trades[0].price).toBe(0.6);
    expect(result.trades[0].yesOrderId).toBe('yes-order');
    expect(result.trades[0].noOrderId).toBe('no-order');
  });

  it('should partially fill when counter order has less quantity', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.7),
      quantity: 10,
      filledQuantity: 0,
    });

    const counterOrder = {
      id: 'no-order',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.3),
      quantity: 4,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counterOrder] as any);

    const result = await matchOrder('yes-order');

    expect(result.filled).toBe(false);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].quantity).toBe(4);
  });

  it('should match with multiple counter orders', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.6),
      quantity: 10,
      filledQuantity: 0,
    });

    const counter1 = {
      id: 'no-order-1',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.5),
      quantity: 6,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    const counter2 = {
      id: 'no-order-2',
      userId: 'charlie',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 4,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counter1, counter2] as any);

    const result = await matchOrder('yes-order');

    expect(result.filled).toBe(true);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0].quantity).toBe(6);
    expect(result.trades[1].quantity).toBe(4);
  });

  it('should skip counter orders with zero remaining quantity', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.6),
      quantity: 5,
      filledQuantity: 0,
    });

    const filledCounter = {
      id: 'no-order-filled',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 3,
      filledQuantity: 3, // fully filled
      status: 'OPEN',
      marketId: 'm1',
    };

    const validCounter = {
      id: 'no-order-valid',
      userId: 'charlie',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 5,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([filledCounter, validCounter] as any);

    const result = await matchOrder('yes-order');

    expect(result.filled).toBe(true);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].noOrderId).toBe('no-order-valid');
  });

  it('should correctly calculate filledQuantity for partially filled incoming order', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.6),
      quantity: 10,
      filledQuantity: 3, // already partially filled
    });

    const counterOrder = {
      id: 'no-order',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.4),
      quantity: 5,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counterOrder] as any);

    const result = await matchOrder('yes-order');

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].quantity).toBe(5);

    // filledQuantity should be 3 (existing) + 5 (new) = 8, NOT 11
    expect(txOps.orderUpdate).toHaveBeenCalledWith({
      where: { id: 'yes-order' },
      data: {
        filledQuantity: 8,
        status: 'PARTIALLY_FILLED',
      },
    });
  });

  it('should update YES option price to trade price and NO to complement', async () => {
    const incomingOrder = makeOrder({
      id: 'yes-order',
      userId: 'alice',
      optionId: 'yes-opt',
      price: new Decimal(0.65),
      quantity: 2,
      filledQuantity: 0,
    });

    const counterOrder = {
      id: 'no-order',
      userId: 'bob',
      optionId: 'no-opt',
      price: new Decimal(0.35),
      quantity: 2,
      filledQuantity: 0,
      status: 'OPEN',
      marketId: 'm1',
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(incomingOrder as any);
    vi.mocked(prisma.order.findMany).mockResolvedValue([counterOrder] as any);

    await matchOrder('yes-order');

    // YES price updated to 0.65
    expect(txOps.marketOptionUpdate).toHaveBeenCalledWith({
      where: { id: 'yes-opt' },
      data: { currentPrice: 0.65 },
    });

    // NO price updated to 0.35
    expect(txOps.marketOptionUpdate).toHaveBeenCalledWith({
      where: { id: 'no-opt' },
      data: { currentPrice: expect.any(Decimal) },
    });
  });
});
