import { Timestamp } from 'firebase-admin/firestore';

/**
 * Convierte un valor de Timestamp o Date a Date
 * @param value - El valor a convertir
 * @returns El valor convertido a Date
 */

export function toDate(value: Timestamp | Date | undefined): Date {

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date();
}
