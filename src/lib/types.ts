import type { DayString } from './dates'

export type Sex = 'female' | 'male'
export type SessionKind = 'strength' | 'running'
export type SessionStatus = 'planned' | 'done' | 'skipped'

export interface PersonData {
  sex: Sex
  ageYears: number
  weightKg: number
  heightCm: number
}

/** Datos de la usuaria y de la segunda persona que come el mismo menú. */
export interface Profile {
  id: 'main'
  name: string
  person: PersonData
  /** Déficit diario objetivo en kcal. */
  deficitKcal: number
  /** Proteína diaria en g por kg de peso. */
  proteinPerKg: number
  partnerName: string
  partner: PersonData
  /** Raciones de la segunda persona por cada ración de la usuaria. */
  partnerPortionFactor: number
}

/** Rutina de fuerza asignada a un día de la semana (0 = lunes). */
export interface Routine {
  weekdayIndex: number
  name: string
  exercises: string[]
}

export interface Session {
  id?: number
  day: DayString
  kind: SessionKind
  status: SessionStatus
  isExtra: boolean
  routineName?: string
  /** Identificador del entreno importado, para no duplicarlo si se importa dos veces. */
  externalId?: string
  startedAt?: string
  durationMin?: number
  distanceKm?: number
  activeKcal?: number
  avgHeartRate?: number
  maxHeartRate?: number
}

export interface StrengthSet {
  id?: number
  sessionId: number
  exerciseName: string
  reps: number
  weightKg: number
  order: number
  createdAt: number
}

/** Un entreno que llega desde el Atajo del iPhone (o escrito a mano). */
export interface ImportedWorkout {
  externalId: string
  kind: SessionKind
  startedAt: string
  day: DayString
  durationMin?: number
  distanceKm?: number
  activeKcal?: number
  avgHeartRate?: number
  maxHeartRate?: number
}

export const kindLabel: Record<SessionKind, string> = { strength: 'Fuerza', running: 'Running' }
export const statusLabel: Record<SessionStatus, string> = { planned: 'Pendiente', done: 'Hecho', skipped: 'Saltado' }

export function sessionTitle(s: Session): string {
  return [kindLabel[s.kind], s.routineName, s.isExtra ? 'extra' : undefined].filter(Boolean).join(' · ')
}
