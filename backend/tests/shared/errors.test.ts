import { describe, it, expect, vi } from 'vitest';
import { AppError, errorHandler } from '../../src/shared/errors';
import { Request, Response, NextFunction } from 'express';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('AppError', () => {
  it('should create an error with statusCode, message, and code', () => {
    const error = new AppError(400, 'Bad request', 'VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('errorHandler', () => {
  it('should handle AppError with correct status and body', () => {
    const err = new AppError(404, 'Not found', 'NOT_FOUND');
    const res = mockRes();
    errorHandler(err, {} as Request, res, vi.fn() as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  });

  it('should handle generic Error with 500', () => {
    const err = new Error('Something broke');
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, {} as Request, res, vi.fn() as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
    consoleSpy.mockRestore();
  });
});
