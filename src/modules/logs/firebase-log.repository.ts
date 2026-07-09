import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '@/config/firebase.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { toDate } from '@/shared/utils/date.utils.js';
import { resolveTaskCode } from '@/modules/tasks/task-code.utils.js';
import type { CreateLogDto } from './log.dto.js';
import type { Log } from './log.model.js';
import type { LogRepository } from './log.repository.js';
import type { PaginationQuery } from '@/shared/types/pagination.types.js';

//Nombre de la colección en Firestore
const COLLECTION = 'logs';

function docToLog(id: string, data: DocumentData): Log {
  const taskId = data.taskId as string;

  return {
    id,
    taskId,
    taskCode: resolveTaskCode(taskId, data.taskCode as string | undefined),
    action: data.action as string,
    detail: data.detail as string,
    createdAt: toDate(data.createdAt as Timestamp | Date | undefined),
  };
}

//Implementación de la interfaz LogRepository
export class FirebaseLogRepository implements LogRepository {
  private get collection() {
    return getFirestore().collection(COLLECTION);
  }

  //Obtener logs paginados ordenados por fecha de creación
  async findAll(pagination: PaginationQuery) {
    return paginateByCreatedAt(this.collection, docToLog, pagination);
  }

  //Crear un nuevo log
  async create(data: CreateLogDto): Promise<Log> {
    const taskCode = resolveTaskCode(data.taskId, data.taskCode);

    const docRef = await this.collection.add({
      taskId: data.taskId,
      taskCode,
      action: data.action,
      detail: data.detail,
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return docToLog(doc.id, doc.data()!);
  }
}
