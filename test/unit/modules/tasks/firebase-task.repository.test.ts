import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFirestore } from '@/config/firebase.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { FirebaseTaskRepository } from '@/modules/tasks/firebase-task.repository.js';
import { nextTaskCode, TASK_COUNTER_DOC_ID } from '@/modules/tasks/task-code.utils.js';
import {
  createMockAddRef,
  createMockDocRef,
  firestoreTimestamp,
  mockFirestoreDoc,
  mockMissingFirestoreDoc,
} from '../../../helpers/mock-firestore.js';

vi.mock('@/config/firebase.js', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('@/modules/tasks/task-code.utils.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/tasks/task-code.utils.js')>();
  return {
    ...actual,
    nextTaskCode: vi.fn(),
  };
});

vi.mock('@/shared/utils/pagination.utils.js', () => ({
  paginateByCreatedAt: vi.fn(),
}));

describe('FirebaseTaskRepository', () => {
  const repository = new FirebaseTaskRepository();
  const createdAt = firestoreTimestamp(new Date('2026-07-09T10:00:00.000Z'));

  const mockCollection = {
    doc: vi.fn(),
    add: vi.fn(),
    orderBy: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockReturnValue(mockCollection),
    } as never);
  });

  it('findById devuelve null para el documento contador', async () => {
    const result = await repository.findById(TASK_COUNTER_DOC_ID);

    expect(result).toBeNull();
    expect(mockCollection.doc).not.toHaveBeenCalled();
  });

  it('findById devuelve la tarea mapeada', async () => {
    const doc = mockFirestoreDoc('task-1', {
      code: 'TAN-1',
      title: 'Bug login',
      description: 'Detalle',
      status: 'pending',
      priority: 'medium',
      assignedUserId: null,
      createdAt,
      updatedAt: createdAt,
    });

    mockCollection.doc.mockReturnValue(createMockDocRef(doc));

    const result = await repository.findById('task-1');

    expect(result).toMatchObject({
      id: 'task-1',
      code: 'TAN-1',
      title: 'Bug login',
    });
  });

  it('findById devuelve null si el documento no existe', async () => {
    mockCollection.doc.mockReturnValue(createMockDocRef(mockMissingFirestoreDoc('missing')));

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('create asigna código secuencial y persiste la tarea', async () => {
    vi.mocked(nextTaskCode).mockResolvedValue('TAN-3');

    const createdDoc = mockFirestoreDoc('task-new', {
      code: 'TAN-3',
      title: 'Nueva',
      description: 'Desc',
      status: 'pending',
      priority: 'high',
      assignedUserId: 'user-1',
      createdAt,
      updatedAt: createdAt,
    });

    mockCollection.add.mockResolvedValue(createMockAddRef(createdDoc));

    const result = await repository.create({
      title: 'Nueva',
      description: 'Desc',
      status: 'pending',
      priority: 'high',
      assignedUserId: 'user-1',
    });

    expect(nextTaskCode).toHaveBeenCalledWith(mockCollection);
    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TAN-3',
        title: 'Nueva',
        assignedUserId: 'user-1',
      }),
    );
    expect(result.code).toBe('TAN-3');
  });

  it('findAll delega a paginateByCreatedAt', async () => {
    const pagination = { page: 1, limit: 20 };
    const paginated = {
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };

    vi.mocked(paginateByCreatedAt).mockResolvedValue(paginated);

    const result = await repository.findAll(pagination);

    expect(paginateByCreatedAt).toHaveBeenCalledWith(mockCollection, expect.any(Function), pagination);
    expect(result).toEqual(paginated);
  });

  it('delete elimina el documento por id', async () => {
    const docRef = createMockDocRef(mockMissingFirestoreDoc('task-1'));
    mockCollection.doc.mockReturnValue(docRef);

    await repository.delete('task-1');

    expect(mockCollection.doc).toHaveBeenCalledWith('task-1');
    expect(docRef.delete).toHaveBeenCalled();
  });
});
