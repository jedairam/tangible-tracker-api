import type { User } from '@/modules/users/user.model.js';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@empresa.com',
    createdAt: new Date('2026-07-09T00:00:00.000Z'),
    updatedAt: new Date('2026-07-09T00:00:00.000Z'),
    ...overrides,
  };
}
