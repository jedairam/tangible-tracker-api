import type { CollectionReference } from 'firebase-admin/firestore';

export const TASK_CODE_PREFIX = 'TAN';

export function formatTaskCode(sequence: number): string {
  return `${TASK_CODE_PREFIX}-${sequence}`;
}

/** Fallback para tareas legacy sin campo `code` guardado */
export function legacyTaskCodeFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 1000;
  }
  return `${TASK_CODE_PREFIX}-${100 + (hash % 900)}`;
}

export function resolveTaskCode(id: string, code?: string): string {
  if (id === '_counter') {
    return '';
  }
  return code ?? legacyTaskCodeFromId(id);
}

/** Contador interno en `tasks/_counter` (misma colección, no es una tarea) */
export async function nextTaskCode(tasksCollection: CollectionReference): Promise<string> {
  const counterRef = tasksCollection.doc('_counter');

  const sequence = await tasksCollection.firestore.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const last = counterDoc.exists ? Number(counterDoc.data()?.last ?? 0) : 0;
    const next = last + 1;

    transaction.set(counterRef, { last: next }, { merge: true });

    return next;
  });

  return formatTaskCode(sequence);
}
