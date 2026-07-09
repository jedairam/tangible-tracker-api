import type { CreateLogDto } from './log.dto.js';
import type { Log } from './log.model.js';

export interface LogRepository {
  findAll(): Promise<Log[]>;
  create(data: CreateLogDto): Promise<Log>;
}
