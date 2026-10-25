import type { SessionKind } from './types'

/** Semana fija: fuerza lunes y miércoles, running martes y jueves. */
export const weekPlan: Partial<Record<number, SessionKind>> = {
  0: 'strength',
  1: 'running',
  2: 'strength',
  3: 'running',
}
