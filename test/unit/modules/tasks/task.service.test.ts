import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOG_ACTIONS } from '@/modules/logs/log.model.js';
import type { LogService } from '@/modules/logs/log.service.js';
import type { Task } from '@/modules/tasks/task.model.js';
import type { TaskRepository } from '@/modules/tasks/task.repository.js';
import type { UserService } from '@/modules/users/user.service.js';
import { TaskService } from '@/modules/tasks/task.service.js';
import { NotFoundError } from '@/shared/errors/not-found.error.js';
import { ValidationError } from '@/shared/errors/validation.error.js';
import { makeLog } from '../../../helpers/factories/log.factory.js';

const baseTask: Task = {
  id: 'task-1',
  code: 'TAN-1',
  title: 'Incidencia login',
  description: 'Error en producción',
  status: 'pending',
  priority: 'medium',
  assignedUserId: null,
  createdAt: new Date('2026-07-09T00:00:00.000Z'),
  updatedAt: new Date('2026-07-09T00:00:00.000Z'),
};

function createMocks() {
  const taskRepository: TaskRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const logService = {
    create: vi.fn(),
    findAll: vi.fn(),
    subscribe: vi.fn(),
  } as unknown as LogService;

  const userService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as UserService;

  const service = new TaskService(taskRepository, logService, userService);

  return { taskRepository, logService, userService, service };
}

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create persists task and registers TASK_CREATED log', async () => {
    const { taskRepository, logService, service } = createMocks();
    vi.mocked(taskRepository.create).mockResolvedValue(baseTask);
    vi.mocked(logService.create).mockResolvedValue(
      makeLog({
        action: LOG_ACTIONS.TASK_CREATED,
        detail: `Tarea "${baseTask.title}" creada`,
      }),
    );

    const result = await service.create({
      title: baseTask.title,
      description: baseTask.description,
      status: baseTask.status,
      priority: baseTask.priority,
    });

    expect(result).toEqual(baseTask);
    expect(logService.create).toHaveBeenCalledWith({
      taskId: baseTask.id,
      taskCode: baseTask.code,
      action: LOG_ACTIONS.TASK_CREATED,
      detail: `Tarea "${baseTask.title}" creada`,
    });
  });

  it('findById throws NotFoundError when task does not exist', async () => {
    const { taskRepository, service } = createMocks();
    vi.mocked(taskRepository.findById).mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('update registers STATUS_CHANGED log when status changes', async () => {
    const { taskRepository, logService, service } = createMocks();
    const updatedTask: Task = { ...baseTask, status: 'in_progress' };

    vi.mocked(taskRepository.findById).mockResolvedValue(baseTask);
    vi.mocked(taskRepository.update).mockResolvedValue(updatedTask);
    vi.mocked(logService.create).mockResolvedValue(
      makeLog({
        id: 'log-2',
        action: LOG_ACTIONS.STATUS_CHANGED,
        detail: 'Estado cambiado de pendiente a en progreso',
      }),
    );

    await service.update(baseTask.id, { status: 'in_progress' });

    expect(logService.create).toHaveBeenCalledWith({
      taskId: baseTask.id,
      taskCode: baseTask.code,
      action: LOG_ACTIONS.STATUS_CHANGED,
      detail: 'Estado cambiado de pendiente a en progreso',
    });
  });

  it('update registers TASK_UPDATED log when status does not change', async () => {
    const { taskRepository, logService, service } = createMocks();
    const updatedTask: Task = { ...baseTask, title: 'Nuevo título' };

    vi.mocked(taskRepository.findById).mockResolvedValue(baseTask);
    vi.mocked(taskRepository.update).mockResolvedValue(updatedTask);
    vi.mocked(logService.create).mockResolvedValue(
      makeLog({
        id: 'log-3',
        action: LOG_ACTIONS.TASK_UPDATED,
        detail: `Tarea "${updatedTask.title}" actualizada`,
      }),
    );

    await service.update(baseTask.id, { title: 'Nuevo título' });

    expect(logService.create).toHaveBeenCalledWith({
      taskId: baseTask.id,
      taskCode: baseTask.code,
      action: LOG_ACTIONS.TASK_UPDATED,
      detail: `Tarea "${updatedTask.title}" actualizada`,
    });
  });

  it('create validates assigned user when provided', async () => {
    const { taskRepository, logService, userService, service } = createMocks();
    const assignedTask: Task = { ...baseTask, assignedUserId: 'user-1' };

    vi.mocked(userService.findById).mockResolvedValue({
      id: 'user-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@empresa.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(taskRepository.create).mockResolvedValue(assignedTask);
    vi.mocked(logService.create).mockResolvedValue(
      makeLog({
        taskId: assignedTask.id,
        action: LOG_ACTIONS.TASK_CREATED,
        detail: `Tarea "${assignedTask.title}" creada`,
      }),
    );

    await service.create({
      title: baseTask.title,
      description: baseTask.description,
      status: baseTask.status,
      priority: baseTask.priority,
      assignedUserId: 'user-1',
    });

    expect(userService.findById).toHaveBeenCalledWith('user-1');
  });

  it('delete removes task and registers TASK_DELETED log', async () => {
    const { taskRepository, logService, service } = createMocks();

    vi.mocked(taskRepository.findById).mockResolvedValue(baseTask);
    vi.mocked(taskRepository.delete).mockResolvedValue();
    vi.mocked(logService.create).mockResolvedValue(
      makeLog({
        id: 'log-4',
        action: LOG_ACTIONS.TASK_DELETED,
        detail: `Tarea "${baseTask.title}" eliminada`,
      }),
    );

    await service.delete(baseTask.id);

    expect(taskRepository.delete).toHaveBeenCalledWith(baseTask.id);
    expect(logService.create).toHaveBeenCalledWith({
      taskId: baseTask.id,
      taskCode: baseTask.code,
      action: LOG_ACTIONS.TASK_DELETED,
      detail: `Tarea "${baseTask.title}" eliminada`,
    });
  });

  it('findAll delega al repository', async () => {
    const { taskRepository, service } = createMocks();
    const pagination = { page: 1, limit: 20 };
    const paginated = {
      items: [baseTask],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    };

    vi.mocked(taskRepository.findAll).mockResolvedValue(paginated);

    const result = await service.findAll(pagination);

    expect(taskRepository.findAll).toHaveBeenCalledWith(pagination);
    expect(result).toEqual(paginated);
  });

  it('create lanza ValidationError si el usuario asignado no existe', async () => {
    const { userService, service } = createMocks();

    vi.mocked(userService.findById).mockRejectedValue(new NotFoundError('Usuario no encontrado'));

    await expect(
      service.create({
        title: baseTask.title,
        description: baseTask.description,
        status: baseTask.status,
        priority: baseTask.priority,
        assignedUserId: 'missing-user',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('update lanza NotFoundError si la tarea no existe', async () => {
    const { taskRepository, service } = createMocks();
    vi.mocked(taskRepository.findById).mockResolvedValue(null);

    await expect(service.update('missing-id', { title: 'Nuevo' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('delete lanza NotFoundError si la tarea no existe', async () => {
    const { taskRepository, service } = createMocks();
    vi.mocked(taskRepository.findById).mockResolvedValue(null);

    await expect(service.delete('missing-id')).rejects.toBeInstanceOf(NotFoundError);
  });
});
