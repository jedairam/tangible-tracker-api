import { describe, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { toDate } from '@/shared/utils/date.utils.js';

describe('toDate', () => {
  it('convierte Timestamp de Firestore a Date', () => {
    const date = new Date('2026-07-09T12:00:00.000Z');
    const timestamp = Timestamp.fromDate(date);

    expect(toDate(timestamp)).toEqual(date);
  });

  it('devuelve la misma instancia si ya es Date', () => {
    const date = new Date('2026-07-09T12:00:00.000Z');

    expect(toDate(date)).toBe(date);
  });

  it('devuelve fecha actual si el valor es undefined', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T15:00:00.000Z'));

    expect(toDate(undefined)).toEqual(new Date('2026-07-09T15:00:00.000Z'));

    vi.useRealTimers();
  });
});
