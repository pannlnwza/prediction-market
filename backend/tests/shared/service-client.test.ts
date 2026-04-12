import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServiceClient } from '../../src/shared/service-client';
import { AppError } from '../../src/shared/errors';

describe('createServiceClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('SERVICE_KEY', 'test-key');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should make GET request with service key header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const client = createServiceClient('http://localhost:3000');
    const result = await client.get('/api/test');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'X-Service-Key': 'test-key',
        'Content-Type': 'application/json',
      },
      body: undefined,
    });
    expect(result).toEqual({ data: 'test' });
  });

  it('should make POST request with body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const client = createServiceClient('http://localhost:3003');
    await client.post('/api/wallet/escrow/lock', { userId: '1', amount: 100 });

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3003/api/wallet/escrow/lock', {
      method: 'POST',
      headers: {
        'X-Service-Key': 'test-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: '1', amount: 100 }),
    });
  });

  it('should throw AppError on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { code: 'INSUFFICIENT_BALANCE', message: 'Not enough funds' } }),
    });

    const client = createServiceClient('http://localhost:3003');

    await expect(client.post('/api/wallet/escrow/lock', {})).rejects.toThrow(AppError);
    await expect(client.post('/api/wallet/escrow/lock', {})).rejects.toMatchObject({
      statusCode: 400,
      code: 'INSUFFICIENT_BALANCE',
    });
  });

  it('should handle error response without json body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
    });

    const client = createServiceClient('http://localhost:3003');

    await expect(client.get('/api/test')).rejects.toThrow(AppError);
  });
});
