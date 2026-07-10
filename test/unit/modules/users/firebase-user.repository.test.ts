import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFirestore } from '@/config/firebase.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { FirebaseUserRepository } from '@/modules/users/firebase-user.repository.js';
import { ValidationError } from '@/shared/errors/validation.error.js';
import {
  createMockAddRef,
  createMockDocRef,
  firestoreTimestamp,
  mockFirestoreDoc,
} from '../../../helpers/mock-firestore.js';

vi.mock('@/config/firebase.js', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('@/shared/utils/pagination.utils.js', () => ({
  paginateByCreatedAt: vi.fn(),
}));

describe('FirebaseUserRepository', () => {
  const repository = new FirebaseUserRepository();
  const createdAt = firestoreTimestamp(new Date('2026-07-09T10:00:00.000Z'));

  const emailQueryGet = vi.fn();
  const mockCollection = {
    doc: vi.fn(),
    add: vi.fn(),
    where: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection.where.mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: emailQueryGet,
      }),
    });

    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockReturnValue(mockCollection),
    } as never);
  });

  it('create normaliza email y persiste usuario nuevo', async () => {
    emailQueryGet.mockResolvedValue({ empty: true });

    const createdDoc = mockFirestoreDoc('user-1', {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
      createdAt,
      updatedAt: createdAt,
    });

    mockCollection.add.mockResolvedValue(createMockAddRef(createdDoc));

    const result = await repository.create({
      firstName: ' Juan ',
      lastName: ' Pérez ',
      email: ' Juan@Empresa.COM ',
    });

    expect(mockCollection.add).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@empresa.com',
      }),
    );
    expect(result.email).toBe('juan@empresa.com');
  });

  it('create lanza ValidationError si el email ya existe', async () => {
    emailQueryGet.mockResolvedValue({
      empty: false,
      docs: [
        mockFirestoreDoc('user-existing', {
          firstName: 'Otro',
          lastName: 'Usuario',
          email: 'juan@empresa.com',
          createdAt,
          updatedAt: createdAt,
        }),
      ],
    });

    await expect(
      repository.create({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@empresa.com',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('update lanza ValidationError si el email pertenece a otro usuario', async () => {
    emailQueryGet.mockResolvedValue({
      empty: false,
      docs: [
        mockFirestoreDoc('other-user', {
          firstName: 'Otro',
          lastName: 'Usuario',
          email: 'otro@empresa.com',
          createdAt,
          updatedAt: createdAt,
        }),
      ],
    });

    const updatedDoc = mockFirestoreDoc('user-1', {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'otro@empresa.com',
      createdAt,
      updatedAt: createdAt,
    });

    mockCollection.doc.mockReturnValue(createMockDocRef(updatedDoc));

    await expect(
      repository.update('user-1', { email: 'otro@empresa.com' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('findById devuelve usuario mapeado', async () => {
    const doc = mockFirestoreDoc('user-1', {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
      createdAt,
      updatedAt: createdAt,
    });

    mockCollection.doc.mockReturnValue(createMockDocRef(doc));

    const result = await repository.findById('user-1');

    expect(result).toMatchObject({
      id: 'user-1',
      email: 'juan@empresa.com',
    });
  });

  it('findAll delega a paginateByCreatedAt', async () => {
    const pagination = { page: 1, limit: 10 };
    const paginated = {
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };

    vi.mocked(paginateByCreatedAt).mockResolvedValue(paginated);

    const result = await repository.findAll(pagination);

    expect(paginateByCreatedAt).toHaveBeenCalled();
    expect(result).toEqual(paginated);
  });
});
