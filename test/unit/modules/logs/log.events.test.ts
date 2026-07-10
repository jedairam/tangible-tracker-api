import { describe, expect, it, vi } from 'vitest';
import { emitLogCreated, LOG_CREATED_EVENT, logEvents } from '@/modules/logs/log.events.js';
import { makeLog } from '../../../helpers/factories/log.factory.js';

describe('log.events', () => {
  it('emitLogCreated notifica a los listeners', () => {
    const handler = vi.fn();
    const log = makeLog();

    logEvents.on(LOG_CREATED_EVENT, handler);
    emitLogCreated(log);

    expect(handler).toHaveBeenCalledWith(log);

    logEvents.off(LOG_CREATED_EVENT, handler);
  });
});
