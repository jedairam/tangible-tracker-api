import { AppError } from './app.error.js';

//Clase para los errores de validación
export class ValidationError extends AppError {
  constructor(message = 'Validación fallida') {
    super(400, message);
    this.name = 'ValidationError';
  }
}
