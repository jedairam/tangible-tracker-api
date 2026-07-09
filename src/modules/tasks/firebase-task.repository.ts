import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '../../config/firebase.js';
import { toDate } from '../../shared/utils/date.utils.js';
import type { CreateTaskDto, UpdateTaskDto } from './task.dto.js';
import type { Task, TaskPriority, TaskStatus } from './task.model.js';
import type { TaskRepository } from './task.repository.js';

//Nombre de la colección en Firestore
const COLLECTION = 'tasks';

function docToTask(id: string, data: DocumentData): Task {
  return {
    id,
    title: data.title as string,
    description: data.description as string,
    status: data.status as TaskStatus,
    priority: data.priority as TaskPriority,
    createdAt: toDate(data.createdAt as Timestamp | Date | undefined),
    updatedAt: toDate(data.updatedAt as Timestamp | Date | undefined),
  };
}

//Implementación de la interfaz TaskRepository
export class FirebaseTaskRepository implements TaskRepository {
  private get collection() {
    return getFirestore().collection(COLLECTION);
  }

  //Obtener todas las tareas ordenadas por fecha de creación
  async findAll(): Promise<Task[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => docToTask(doc.id, doc.data()));
  }

  //Obtener una tarea por su ID
  async findById(id: string): Promise<Task | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return docToTask(doc.id, doc.data()!);
  }

  //Crear una nueva tarea
  async create(data: CreateTaskDto): Promise<Task> {
    const docRef = await this.collection.add({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
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
