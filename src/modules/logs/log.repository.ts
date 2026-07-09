import type { CreateLogDto } from './log.dto.js';
import type { Log } from './log.model.js';
import type { PaginatedResult, PaginationQuery } from '../../shared/types/pagination.types.js';

export interface LogRepository {
  findAll(pagination: PaginationQuery): Promise<PaginatedResult<Log>>;
  create(data: CreateLogDto): Promise<Log>;
}
