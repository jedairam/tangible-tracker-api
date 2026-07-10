import { Timestamp } from 'firebase-admin/firestore';
import { vi } from 'vitest';

export function firestoreTimestamp(date: Date) {
  return Timestamp.fromDate(date);
}

export type MockFirestoreDoc = {
  id: string;
  exists: boolean;
  data: () => Record<string, unknown>;
};

export function mockFirestoreDoc(id: string, data: Record<string, unknown>): MockFirestoreDoc {
  return {
    id,
    exists: true,
    data: () => data,
  };
}

export function mockMissingFirestoreDoc(id: string): MockFirestoreDoc {
  return {
    id,
    exists: false,
    data: () => ({}),
  };
}

export function createMockDocRef(getResult: MockFirestoreDoc, options?: { update?: ReturnType<typeof vi.fn> }) {
  return {
    get: vi.fn().mockResolvedValue(getResult),
    update: options?.update ?? vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockAddRef(createdDoc: MockFirestoreDoc) {
  return {
    get: vi.fn().mockResolvedValue(createdDoc),
  };
}
