import { EventEmitter } from 'node:events';
import type { Log } from './log.model.js';

//EventEmitter para los eventos de los logs
export const logEvents = new EventEmitter();

//Evento para el log de creación
export const LOG_CREATED_EVENT = 'log:created';

//Emitir el evento de creación de un log
export function emitLogCreated(log: Log): void {
  logEvents.emit(LOG_CREATED_EVENT, log);
}
