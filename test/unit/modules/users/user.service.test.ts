import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/modules/users/user.model.js';
import type { UserRepository } from '@/modules/users/user.repository.js';
import { UserService } from '@/modules/users/user.service.js';
import { NotFoundError } from '@/shared/errors/not-found.error.js';

const baseUser: User = {
  id: 'user-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@empresa.com',
  createdAt: new Date('2026-07-09T00:00:00.000Z'),
  updatedAt: new Date('2026-07-09T00:00:00.000Z'),
};

function createMocks() {
  const userRepository: UserRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const service = new UserService(userRepository);

  return { userRepository, service };
}

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create delegates to repository', async () => {
    const { userRepository, service } = createMocks();
    vi.mocked(userRepository.create).mockResolvedValue(baseUser);

    const result = await service.create({
      firstName: baseUser.firstName,
      lastName: baseUser.lastName,
      email: baseUser.email,
    });

    expect(result).toEqual(baseUser);
  });

  it('findById throws NotFoundError when user does not exist', async () => {
    const { userRepository, service } = createMocks();
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('update verifies existence before updating', async () => {
    const { userRepository, service } = createMocks();
    const updatedUser: User = { ...baseUser, firstName: 'Pedro' };

    vi.mocked(userRepository.findById).mockResolvedValue(baseUser);
    vi.mocked(userRepository.update).mockResolvedValue(updatedUser);

    const result = await service.update(baseUser.id, { firstName: 'Pedro' });

    expect(result).toEqual(updatedUser);
    expect(userRepository.update).toHaveBeenCalledWith(baseUser.id, { firstName: 'Pedro' });
  });

  it('delete removes user after existence check', async () => {
    const { userRepository, service } = createMocks();

    vi.mocked(userRepository.findById).mockResolvedValue(baseUser);
    vi.mocked(userRepository.delete).mockResolvedValue();

    await service.delete(baseUser.id);

    expect(userRepository.delete).toHaveBeenCalledWith(baseUser.id);
  });

  it('findAll delega al repository', async () => {
    const { userRepository, service } = createMocks();
    const pagination = { page: 1, limit: 20 };
    const paginated = {
      items: [baseUser],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    vi.mocked(userRepository.findAll).mockResolvedValue(paginated);

    const result = await service.findAll(pagination);

    expect(userRepository.findAll).toHaveBeenCalledWith(pagination);
    expect(result).toEqual(paginated);
  });

  it('update lanza NotFoundError si el usuario no existe', async () => {
    const { userRepository, service } = createMocks();
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(service.update('missing-id', { firstName: 'Pedro' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
