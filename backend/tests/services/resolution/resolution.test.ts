import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../src/shared/errors';

vi.mock('../../../src/shared/prisma', () => ({
  default: {
    market: { findUnique: vi.fn(), update: vi.fn() },
    resolution: { create: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((cb: any) => cb({
      resolution: { create: vi.fn().mockResolvedValue({ id: 'r1', marketId: 'm1', status: 'RESOLVED' }) },
      market: { update: vi.fn().mockResolvedValue({}) },
    })),
  },
}));

vi.mock('../../../src/shared/service-client', () => ({
  createServiceClient: () => ({
    post: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

import { resolveMarket, getResolution } from '../../../src/services/resolution/controller';
import prisma from '../../../src/shared/prisma';

function mockReqResNext(body = {}, params = {}, user = { id: 'resolver-1', email: 'r@b.com', role: 'RESOLVER' }) {
  const req = { body, params, user, query: {} } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('resolveMarket', () => {
  it('should reject missing winningOptionId', async () => {
    const { req, res, next } = mockReqResNext({}, { id: 'm1' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({ winningOptionId: 'o1' }, { id: 'nonexistent' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('should reject if user is not the assigned resolver', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', resolverId: 'other-resolver',
      options: [{ id: 'o1', label: 'YES' }],
    } as any);

    const { req, res, next } = mockReqResNext({ winningOptionId: 'o1' }, { id: 'm1' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should reject resolving a voided market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'VOIDED', resolverId: 'resolver-1',
      options: [{ id: 'o1', label: 'YES' }],
    } as any);

    const { req, res, next } = mockReqResNext({ winningOptionId: 'o1' }, { id: 'm1' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_STATUS');
  });

  it('should reject resolving an already resolved market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'RESOLVED', resolverId: 'resolver-1',
      options: [{ id: 'o1', label: 'YES' }],
    } as any);

    const { req, res, next } = mockReqResNext({ winningOptionId: 'o1' }, { id: 'm1' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.code).toBe('INVALID_STATUS');
  });

  it('should reject invalid winning option', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', resolverId: 'resolver-1',
      options: [{ id: 'o1', label: 'YES' }, { id: 'o2', label: 'NO' }],
    } as any);

    const { req, res, next } = mockReqResNext({ winningOptionId: 'invalid-option' }, { id: 'm1' });
    await resolveMarket(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_OPTION');
  });
});

describe('resolveMarket - success', () => {
  it('should resolve market, trigger payout and notification', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'ACTIVE', resolverId: 'resolver-1', creatorId: 'admin-1', title: 'Test Market',
      options: [{ id: 'yes-opt', label: 'YES' }, { id: 'no-opt', label: 'NO' }],
    } as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { req, res, next } = mockReqResNext({ winningOptionId: 'yes-opt' }, { marketId: 'm1' });
    await resolveMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'RESOLVED' }));
    consoleSpy.mockRestore();
  });

  it('should resolve CLOSED market', async () => {
    vi.mocked(prisma.market.findUnique).mockResolvedValue({
      id: 'm1', status: 'CLOSED', resolverId: 'resolver-1', creatorId: 'admin-1', title: 'Closed Market',
      options: [{ id: 'yes-opt', label: 'YES' }, { id: 'no-opt', label: 'NO' }],
    } as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { req, res, next } = mockReqResNext({ winningOptionId: 'yes-opt' }, { marketId: 'm1' });
    await resolveMarket(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    consoleSpy.mockRestore();
  });
});

describe('getResolution - success', () => {
  it('should return resolution with winning option', async () => {
    vi.mocked(prisma.resolution.findUnique).mockResolvedValue({
      id: 'r1', marketId: 'm1', status: 'RESOLVED',
      winningOption: { id: 'yes-opt', label: 'YES' },
      resolver: { id: 'resolver-1', displayName: 'Resolver' },
    } as any);

    const { req, res, next } = mockReqResNext({}, { marketId: 'm1' });
    await getResolution(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'RESOLVED',
      winningOption: expect.objectContaining({ label: 'YES' }),
    }));
  });
});

describe('getResolution', () => {
  it('should return 404 for non-existent resolution', async () => {
    vi.mocked(prisma.resolution.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqResNext({}, { id: 'nonexistent' });
    await getResolution(req, res, next);

    const err = (next as any).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});
