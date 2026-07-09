import type { Response } from 'express';
import type { PaginatedResult, PaginationQuery } from '../../shared/types/pagination.types.js';
import { emitLogCreated, LOG_CREATED_EVENT, logEvents } from './log.events.js';
import type { CreateLogDto } from './log.dto.js';
import type { Log } from './log.model.js';
import type { LogRepository } from './log.repository.js';

//Servicio para los logs
export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  //Obtener logs paginados
  async findAll(pagination: PaginationQuery): Promise<PaginatedResult<Log>> {
    return this.logRepository.findAll(pagination);
  }

  //Crear un nuevo log
  async create(data: CreateLogDto): Promise<Log> {
    const log = await this.logRepository.create(data);
    emitLogCreated(log);
    return log;
  }

  //Subscribirse a los eventos de los logs
  subscribe(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    //Manejador para los eventos de los logs
    const handler = (log: Log) => {
      const payload = JSON.stringify({ success: true, data: log });
      res.write(`data: ${payload}\n\n`);
    };

    //Subscribirse al evento de creación de un log
    logEvents.on(LOG_CREATED_EVENT, handler);

    //Desuscribirse del evento de creación de un log
    res.on('close', () => {
      logEvents.off(LOG_CREATED_EVENT, handler);
    });
  }
}
