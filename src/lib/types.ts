import type { DayString } from './dates'
import type { MealSlot } from './recipes'

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
  /** true cuando la usuaria ya ha revisado sus datos en Ajustes. */
  configured?: boolean
  /** Ajustar déficit y consejos según la fase del ciclo (por defecto sí). */
  cycleAdjust?: boolean
  /** Duración del ciclo cuando aún no hay suficientes reglas registradas. */
  cycleLengthDays?: number
  /** Días de regla. */
  periodLengthDays?: number
  /** Alimentos que no se deben sugerir (se buscan en el nombre y los ingredientes). */
  excludedFoods?: string[]
}

export interface Session {
  id?: number
  day: DayString
  kind: SessionKind
  status: SessionStatus
  isExtra: boolean
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
  return [kindLabel[s.kind], s.isExtra ? 'extra' : undefined].filter(Boolean).join(' · ')
}

export interface Meal {
  id?: number
  day: DayString
  slot: MealSlot
  recipeId?: string
  /** Comida libre, sin receta. */
  customName?: string
  customKcal?: number
  /** Raciones para la usuaria; la otra persona come `partnerPortionFactor` veces esto. */
  portions: number
}

/** Primer día de una regla. */
export interface PeriodStart {
  start: DayString
}

export interface ShoppingCheck {
  key: string
  checked: boolean
}
