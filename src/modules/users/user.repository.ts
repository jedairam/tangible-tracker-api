import type { PaginatedResult, PaginationQuery } from '@/shared/types/pagination.types.js';
import type { CreateUserDto, UpdateUserDto } from './user.dto.js';
import type { User } from './user.model.js';

//Interfaz para el repositorio de usuarios
export interface UserRepository {
  findAll(pagination: PaginationQuery): Promise<PaginatedResult<User>>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
