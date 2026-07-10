import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

export function createMockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    on: vi.fn(),
  } as unknown as Response;

  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.json).mockReturnValue(res);

  return res;
}

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    method: 'GET',
    originalUrl: '/api/tasks',
    ...overrides,
  } as Request;
}

export function createMockNext() {
  return vi.fn() as NextFunction;
}
