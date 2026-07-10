import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitLogCreated } from '@/modules/logs/log.events.js';
import type { LogRepository } from '@/modules/logs/log.repository.js';
import { LogService } from '@/modules/logs/log.service.js';
import { makeLog } from '../../../helpers/factories/log.factory.js';
import { createMockResponse } from '../../../helpers/mock-express.js';

const emitLogCreatedMock = vi.fn();

vi.mock('@/modules/logs/log.events.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/logs/log.events.js')>();
  return {
    ...actual,
    emitLogCreated: (...args: Parameters<typeof actual.emitLogCreated>) => {
      emitLogCreatedMock(...args);
      return actual.emitLogCreated(...args);
    },
  };
});

function createMocks() {
  const logRepository: LogRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
  };

  const service = new LogService(logRepository);

  return { logRepository, service };
}

describe('LogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findAll delega al repository con paginación', async () => {
    const { logRepository, service } = createMocks();
    const pagination = { page: 1, limit: 20 };
    const paginated = {
      items: [makeLog()],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    vi.mocked(logRepository.findAll).mockResolvedValue(paginated);

    const result = await service.findAll(pagination);

    expect(logRepository.findAll).toHaveBeenCalledWith(pagination);
    expect(result).toEqual(paginated);
  });

  it('create persiste el log y emite evento SSE', async () => {
    const { logRepository, service } = createMocks();
    const dto = {
      taskId: 'task-1',
      taskCode: 'TAN-1',
      action: 'Tarea creada',
      detail: 'Tarea "Test" creada',
    };
    const log = makeLog(dto);

    vi.mocked(logRepository.create).mockResolvedValue(log);

    const result = await service.create(dto);

    expect(result).toEqual(log);
    expect(logRepository.create).toHaveBeenCalledWith(dto);
    expect(emitLogCreatedMock).toHaveBeenCalledWith(log);
  });

  it('subscribe configura SSE y escribe cuando se emite un log', () => {
    const { service } = createMocks();
    const res = createMockResponse();
    let closeHandler: (() => void) | undefined;

    vi.mocked(res.on).mockImplementation((event: string, handler: () => void) => {
      if (event === 'close') {
        closeHandler = handler;
      }
      return res;
    });

    service.subscribe(res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(res.flushHeaders).toHaveBeenCalled();

    const log = makeLog();
    emitLogCreated(log);

    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ success: true, data: log })}\n\n`,
    );

    expect(closeHandler).toBeTypeOf('function');
  });
});
