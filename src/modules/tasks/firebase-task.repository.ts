import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '@/config/firebase.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { toDate } from '@/shared/utils/date.utils.js';
import { nextTaskCode, TASK_COUNTER_DOC_ID } from './task-code.utils.js';
import type { CreateTaskDto, UpdateTaskDto } from './task.dto.js';
import type { Task, TaskPriority, TaskStatus } from './task.model.js';
import type { TaskRepository } from './task.repository.js';
import type { PaginationQuery } from '@/shared/types/pagination.types.js';

//Nombre de la colección en Firestore
const COLLECTION = 'tasks';

function docToTask(id: string, data: DocumentData): Task {
  return {
    id,
    code: data.code as string,
    title: data.title as string,
    description: data.description as string,
    status: data.status as TaskStatus,
    priority: data.priority as TaskPriority,
    assignedUserId: (data.assignedUserId as string | null | undefined) ?? null,
    createdAt: toDate(data.createdAt as Timestamp | Date | undefined),
    updatedAt: toDate(data.updatedAt as Timestamp | Date | undefined),
  };
}

//Implementación de la interfaz TaskRepository
export class FirebaseTaskRepository implements TaskRepository {
  private get collection() {
    return getFirestore().collection(COLLECTION);
  }

  //Obtener tareas paginadas ordenadas por fecha de creación
  async findAll(pagination: PaginationQuery) {
    return paginateByCreatedAt(this.collection, docToTask, pagination);
  }

  //Obtener una tarea por su ID
  async findById(id: string): Promise<Task | null> {
    if (id === TASK_COUNTER_DOC_ID) {
      return null;
    }

    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return docToTask(doc.id, doc.data()!);
  }

  //Crear una nueva tarea
  async create(data: CreateTaskDto): Promise<Task> {
    const code = await nextTaskCode(this.collection);

    const docRef = await this.collection.add({
      code,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedUserId: data.assignedUserId ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return docToTask(doc.id, doc.data()!);
  }

  //Actualizar una tarea
  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const docRef = this.collection.doc(id);

    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return docToTask(doc.id, doc.data()!);
  }

  //Eliminar una tarea
  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
