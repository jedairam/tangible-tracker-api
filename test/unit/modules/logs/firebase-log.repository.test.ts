import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFirestore } from '@/config/firebase.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { FirebaseLogRepository } from '@/modules/logs/firebase-log.repository.js';
import {
  createMockAddRef,
  firestoreTimestamp,
  mockFirestoreDoc,
} from '../../../helpers/mock-firestore.js';

vi.mock('@/config/firebase.js', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('@/shared/utils/pagination.utils.js', () => ({
  paginateByCreatedAt: vi.fn(),
}));

describe('FirebaseLogRepository', () => {
  const repository = new FirebaseLogRepository();
  const createdAt = firestoreTimestamp(new Date('2026-07-09T10:00:00.000Z'));

  const mockCollection = {
    add: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockReturnValue(mockCollection),
    } as never);
  });

  it('create persiste taskCode junto al log', async () => {
    const dto = {
      taskId: 'task-1',
      taskCode: 'TAN-1',
      action: 'Tarea creada',
      detail: 'Tarea "Bug" creada',
    };

    const createdDoc = mockFirestoreDoc('log-1', {
      ...dto,
      createdAt,
    });

    mockCollection.add.mockResolvedValue(createMockAddRef(createdDoc));

    const result = await repository.create(dto);

    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        taskCode: 'TAN-1',
        action: 'Tarea creada',
      }),
    );
    expect(result).toMatchObject({
      id: 'log-1',
      taskCode: 'TAN-1',
    });
  });

  it('findAll delega a paginateByCreatedAt', async () => {
    const pagination = { page: 1, limit: 50 };
    const paginated = {
      items: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };

    vi.mocked(paginateByCreatedAt).mockResolvedValue(paginated);

    const result = await repository.findAll(pagination);

    expect(paginateByCreatedAt).toHaveBeenCalledWith(mockCollection, expect.any(Function), pagination);
    expect(result).toEqual(paginated);
  });
});
