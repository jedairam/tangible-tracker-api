import { describe, expect, it, vi } from 'vitest';
import type { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';

function createFirestoreMock(docs: Array<{ id: string; data: DocumentData }>, total: number) {
  const pageSnapshot = {
    docs: docs.map((doc) => ({
      id: doc.id,
      data: () => doc.data,
    })),
  };

  const limitChain = {
    get: vi.fn().mockResolvedValue(pageSnapshot),
  };

  const offsetChain = {
    limit: vi.fn().mockReturnValue(limitChain),
  };

  const orderedQuery = {
    count: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: () => ({ count: total }) }),
    }),
    offset: vi.fn().mockReturnValue(offsetChain),
  };

  const collection = {
    orderBy: vi.fn().mockReturnValue(orderedQuery),
  } as unknown as CollectionReference;

  return { collection, orderedQuery, offsetChain };
}

describe('paginateByCreatedAt', () => {
  it('mapea documentos y calcula meta de paginación', async () => {
    const docs = [
      { id: 'a', data: { title: 'Uno' } },
      { id: 'b', data: { title: 'Dos' } },
    ];
    const { collection } = createFirestoreMock(docs, 2);

    const result = await paginateByCreatedAt(
      collection,
      (id, data) => ({ id, title: data.title as string }),
      { page: 1, limit: 20 },
    );

    expect(result.items).toEqual([
      { id: 'a', title: 'Uno' },
      { id: 'b', title: 'Dos' },
    ]);
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('detecta hasNext cuando hay más resultados que el límite', async () => {
    const docs = Array.from({ length: 3 }, (_, index) => ({
      id: `id-${index}`,
      data: { title: `Item ${index}` },
    }));
    const { collection } = createFirestoreMock(docs, 3);

    const result = await paginateByCreatedAt(
      collection,
      (id) => ({ id }),
      { page: 1, limit: 2 },
    );

    expect(result.items).toHaveLength(2);
    expect(result.meta.hasNext).toBe(true);
    expect(result.meta.totalPages).toBe(2);
  });
});
