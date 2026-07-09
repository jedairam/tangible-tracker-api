import { NotFoundError } from '../../shared/errors/not-found.error.js';
import { LOG_ACTIONS } from '../logs/log.model.js';
import type { LogService } from '../logs/log.service.js';
import type { CreateTaskDto, UpdateTaskDto } from './task.dto.js';
import { TASK_STATUS_LABELS, type Task } from './task.model.js';
import type { TaskRepository } from './task.repository.js';

//Servicio para las tareas
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly logService: LogService,
  ) {}

  //Crear una nueva tarea
  async create(data: CreateTaskDto): Promise<Task> {
    const task = await this.taskRepository.create(data);

    //Registrar el log de la creación de la tarea
    await this.logService.create({
      taskId: task.id,
      action: LOG_ACTIONS.TASK_CREATED,
      detail: `Tarea "${task.title}" creada`,
    });

    return task;
  }

  //Obtener todas las tareas
  async findAll(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  //Obtener una tarea por su ID
  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    return task;
  }

  //Actualizar una tarea
  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const existing = await this.taskRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Tarea no encontrada');
    }

    const task = await this.taskRepository.update(id, data);

    //Registrar el log del cambio de estado
    if (data.status !== undefined && data.status !== existing.status) {
      await this.logService.create({
        taskId: task.id,
        action: LOG_ACTIONS.STATUS_CHANGED,
        detail: `Estado cambiado de ${TASK_STATUS_LABELS[existing.status]} a ${TASK_STATUS_LABELS[task.status]}`,
      });
    } else {
      //Registrar el log de la actualización de la tarea
      await this.logService.create({
        taskId: task.id,
        action: LOG_ACTIONS.TASK_UPDATED,
        detail: `Tarea "${task.title}" actualizada`,
      });
    }

    return task;
  }

  //Eliminar una tarea
  async delete(id: string): Promise<void> {
    const existing = await this.taskRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Tarea no encontrada');
    }

    await this.taskRepository.delete(id);

    //Registrar el log de la eliminación de la tarea
    await this.logService.create({
      taskId: id,
      action: LOG_ACTIONS.TASK_DELETED,
      detail: `Tarea "${existing.title}" eliminada`,
    });
  }
}
