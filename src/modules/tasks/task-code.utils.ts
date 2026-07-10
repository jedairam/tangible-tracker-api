import type { CollectionReference } from 'firebase-admin/firestore';

export const TASK_CODE_PREFIX = 'TAN';
export const TASK_COUNTER_DOC_ID = '_counter';

export function formatTaskCode(sequence: number): string {
  return `${TASK_CODE_PREFIX}-${sequence}`;
}

/** Contador interno en `tasks/_counter` (misma colección, no es una tarea) */
export async function nextTaskCode(tasksCollection: CollectionReference): Promise<string> {
  const counterRef = tasksCollection.doc(TASK_COUNTER_DOC_ID);

  const sequence = await tasksCollection.firestore.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const last = counterDoc.exists ? Number(counterDoc.data()?.last ?? 0) : 0;
    const next = last + 1;

    transaction.set(counterRef, { last: next }, { merge: true });

    return next;
  });

  return formatTaskCode(sequence);
}
