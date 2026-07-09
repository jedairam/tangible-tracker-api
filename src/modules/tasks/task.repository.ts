import type { CreateTaskDto, UpdateTaskDto } from './task.dto.js';
import type { Task } from './task.model.js';

//Interfaz para el repositorio de tareas
export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(data: CreateTaskDto): Promise<Task>;
  update(id: string, data: UpdateTaskDto): Promise<Task>;
  delete(id: string): Promise<void>;
}
