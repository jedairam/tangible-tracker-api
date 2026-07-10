import { describe, expect, it } from 'vitest';
import { sendError, sendList, sendPaginatedList, sendSuccess } from '../../src/shared/utils/response.utils.js';

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

describe('response.utils', () => {
  it('sendSuccess wraps data in success envelope', () => {
    const res = createMockResponse();

    sendSuccess(res as never, { id: '1', title: 'Test' }, 201);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: '1', title: 'Test' },
    });
  });

  it('sendList includes meta.total', () => {
    const res = createMockResponse();

    sendList(res as never, [{ id: '1' }, { id: '2' }]);

    expect(res.body).toEqual({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta: { total: 2 },
    });
  });

  it('sendPaginatedList includes pagination meta', () => {
    const res = createMockResponse();

    sendPaginatedList(res as never, {
      items: [{ id: '1' }],
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      },
    });

    expect(res.body).toEqual({
      success: true,
      data: [{ id: '1' }],
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      },
    });
  });

  it('sendError wraps error in standard envelope', () => {
    const res = createMockResponse();

    sendError(res as never, 404, 'Tarea no encontrada');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { statusCode: 404, message: 'Tarea no encontrada' },
    });
  });
});
