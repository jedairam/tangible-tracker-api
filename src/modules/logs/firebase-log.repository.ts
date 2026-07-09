import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '../../config/firebase.js';
import { toDate } from '../../shared/utils/date.utils.js';
import type { CreateLogDto } from './log.dto.js';
import type { Log } from './log.model.js';
import type { LogRepository } from './log.repository.js';

//Nombre de la colección en Firestore
const COLLECTION = 'logs';

function docToLog(id: string, data: DocumentData): Log {
  return {
    id,
    taskId: data.taskId as string,
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

  //Obtener todos los logs ordenados por fecha de creación
  async findAll(): Promise<Log[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => docToLog(doc.id, doc.data()));
  }

  //Crear un nuevo log
  async create(data: CreateLogDto): Promise<Log> {
    const docRef = await this.collection.add({
      taskId: data.taskId,
      action: data.action,
      detail: data.detail,
      createdAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return docToLog(doc.id, doc.data()!);
  }
}
