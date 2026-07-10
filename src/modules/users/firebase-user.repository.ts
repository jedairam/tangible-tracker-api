import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '@/config/firebase.js';
import { ValidationError } from '@/shared/errors/validation.error.js';
import { paginateByCreatedAt } from '@/shared/utils/pagination.utils.js';
import { toDate } from '@/shared/utils/date.utils.js';
import type { CreateUserDto, UpdateUserDto } from './user.dto.js';
import type { User } from './user.model.js';
import type { UserRepository } from './user.repository.js';
import type { PaginationQuery } from '@/shared/types/pagination.types.js';

//Nombre de la colección en Firestore
const COLLECTION = 'users';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function docToUser(id: string, data: DocumentData): User {
  return {
    id,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: data.email as string,
    createdAt: toDate(data.createdAt as Timestamp | Date | undefined),
    updatedAt: toDate(data.updatedAt as Timestamp | Date | undefined),
  };
}

//Implementación de la interfaz UserRepository
export class FirebaseUserRepository implements UserRepository {
  private get collection() {
    return getFirestore().collection(COLLECTION);
  }

  //Obtener todos los usuarios paginados ordenados por fecha de creación
  async findAll(pagination: PaginationQuery) {
    return paginateByCreatedAt(this.collection, docToUser, pagination);
  }

  //Obtener un usuario por su ID
  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return docToUser(doc.id, doc.data()!);
  }

  //Obtener un usuario por su email (privado - validacion de email)
  private async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('email', '==', normalizeEmail(email))
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]!;
    return docToUser(doc.id, doc.data());
  }

  //Crear un nuevo usuario
  async create(data: CreateUserDto): Promise<User> {
    const email = normalizeEmail(data.email);
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ValidationError('El email ya está registrado');
    }

    const docRef = await this.collection.add({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await docRef.get();
    return docToUser(doc.id, doc.data()!);
  }

  //Actualizar un usuario
  async update(id: string, data: UpdateUserDto): Promise<User> {
    const docRef = this.collection.doc(id);

    if (data.email !== undefined) {
      const existing = await this.findByEmail(data.email);

      if (existing && existing.id !== id) {
        throw new ValidationError('El email ya está registrado');
      }
    }

    const payload: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.firstName !== undefined) {
      payload.firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      payload.lastName = data.lastName.trim();
    }

    if (data.email !== undefined) {
      payload.email = normalizeEmail(data.email);
    }

    await docRef.update(payload);

    const doc = await docRef.get();
    return docToUser(doc.id, doc.data()!);
  }

  //Eliminar un usuario
  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
