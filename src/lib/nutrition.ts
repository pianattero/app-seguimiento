import type { PersonData, Session, SessionKind, Sex } from './types'

export interface DayTarget {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

/** Factor de actividad sin contar el entreno (vida diaria sedentaria). */
export const BASE_ACTIVITY_FACTOR = 1.2
/** El Watch suele sobrestimar las kcal activas, así que solo se cuenta el 85 %. */
export const WATCH_CORRECTION = 0.85
const FAT_SHARE = 0.28

/** Nunca se baja de este mínimo, para no comprometer los entrenos. */
export function floorKcal(sex: Sex): number {
  return sex === 'female' ? 1500 : 1800
}

/** Estimación de kcal activas cuando aún no hay dato del Watch. */
export function estimatedKcal(kind: SessionKind): number {
  return { strength: 300, running: 400, dance: 350 }[kind]
}

/** Metabolismo basal, fórmula Mifflin-St Jeor. */
export function bmr(p: PersonData): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears + (p.sex === 'female' ? -161 : 5)
}

export function dayTarget(p: PersonData, trainingKcal: number, deficitKcal: number, proteinPerKg: number): DayTarget {
  const maintenance = bmr(p) * BASE_ACTIVITY_FACTOR + WATCH_CORRECTION * trainingKcal
  const kcal = Math.max(maintenance - deficitKcal, floorKcal(p.sex))
  const protein = proteinPerKg * p.weightKg
  const fat = (kcal * FAT_SHARE) / 9
  const carbs = Math.max((kcal - protein * 4 - fat * 9) / 4, 0)
  return {
    kcal: Math.round(kcal),
    proteinG: Math.round(protein),
    carbsG: Math.round(carbs),
    fatG: Math.round(fat),
  }
}

/** kcal de entreno de un día: lo medido si existe, si no la estimación de lo previsto. */
export function trainingKcal(sessions: Session[]): number {
  return sessions
    .filter((s) => s.status !== 'skipped')
    .reduce((total, s) => total + (s.activeKcal ?? estimatedKcal(s.kind)), 0)
}

/** Raciones de la segunda persona por cada ración de la usuaria, comparando días de descanso. */
export function portionFactor(partner: PersonData, person: PersonData, deficitKcal: number): number {
  const mine = dayTarget(person, 0, deficitKcal, 1.5).kcal
  const theirs = dayTarget(partner, 0, deficitKcal, 1.5).kcal
  return Math.round((theirs / mine) * 10) / 10
}
