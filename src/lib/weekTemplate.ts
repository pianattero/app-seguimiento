import type { SessionKind } from './types'

/** Semana fija: fuerza y zumba los lunes, running martes y jueves, fuerza los miércoles. */
export const weekPlan: Partial<Record<number, SessionKind[]>> = {
  0: ['strength', 'dance'],
  1: ['running'],
  2: ['strength'],
  3: ['running'],
}
