import { AppError } from './app.error.js';

//Clase para los errores de recurso no encontrado
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}
