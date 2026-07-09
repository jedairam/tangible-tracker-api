import type { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import type { PaginatedResult, PaginationQuery } from '../types/pagination.types.js';

export async function paginateByCreatedAt<T>(
  collection: CollectionReference,
  mapDoc: (id: string, data: DocumentData) => T,
  pagination: PaginationQuery,
): Promise<PaginatedResult<T>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const orderedQuery = collection.orderBy('createdAt', 'desc');

  const [countSnapshot, pageSnapshot] = await Promise.all([
    collection.count().get(),
    orderedQuery.offset(offset).limit(limit + 1).get(),
  ]);

  const total = countSnapshot.data().count;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const hasExtra = pageSnapshot.docs.length > limit;
  const docs = hasExtra ? pageSnapshot.docs.slice(0, limit) : pageSnapshot.docs;

  return {
    items: docs.map((doc) => mapDoc(doc.id, doc.data())),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: hasExtra,
      hasPrev: page > 1,
    },
  };
}
