import { describe, expect, it, vi } from 'vitest';
import { formatTaskCode, nextTaskCode, TASK_CODE_PREFIX } from '@/modules/tasks/task-code.utils.js';

describe('task-code.utils', () => {
  it('formatTaskCode builds sequential codes', () => {
    expect(formatTaskCode(1)).toBe('TAN-1');
    expect(formatTaskCode(42)).toBe('TAN-42');
    expect(formatTaskCode(1).startsWith(TASK_CODE_PREFIX)).toBe(true);
  });

  it('nextTaskCode incrementa el contador en transacción', async () => {
    const counterRef = { id: '_counter' };
    const transaction = {
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ last: 5 }) }),
      set: vi.fn(),
    };

    const collection = {
      doc: vi.fn().mockReturnValue(counterRef),
      firestore: {
        runTransaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<number>) =>
          callback(transaction),
        ),
      },
    };

    const code = await nextTaskCode(collection as never);

    expect(code).toBe('TAN-6');
    expect(transaction.set).toHaveBeenCalledWith(counterRef, { last: 6 }, { merge: true });
  });

  it('nextTaskCode inicia en TAN-1 si no existe contador', async () => {
    const counterRef = { id: '_counter' };
    const transaction = {
      get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
      set: vi.fn(),
    };

    const collection = {
      doc: vi.fn().mockReturnValue(counterRef),
      firestore: {
        runTransaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<number>) =>
          callback(transaction),
        ),
      },
    };

    const code = await nextTaskCode(collection as never);

    expect(code).toBe('TAN-1');
  });
});
