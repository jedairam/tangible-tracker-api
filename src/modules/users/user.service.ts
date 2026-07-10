import { NotFoundError } from '@/shared/errors/not-found.error.js';
import type { PaginatedResult, PaginationQuery } from '@/shared/types/pagination.types.js';
import type { CreateUserDto, UpdateUserDto } from './user.dto.js';
import type { User } from './user.model.js';
import type { UserRepository } from './user.repository.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: CreateUserDto): Promise<User> {
    return this.userRepository.create(data);
  }

  async findAll(pagination: PaginationQuery): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(pagination);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    await this.findById(id);
    return this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.delete(id);
  }
}
