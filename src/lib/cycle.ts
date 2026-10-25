import { addDays, daysBetween, type DayString } from './dates'
import type { Profile } from './types'

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea'

export interface CycleInfo {
  dayOfCycle: number
  cycleLength: number
  phase: CyclePhase
  nextPeriod: DayString
}

/**
 * Qué cambia en cada fase. La evidencia sobre ajustar por fase es limitada y varía entre personas:
 * son sugerencias, y el ajuste de calorías se puede desactivar en Ajustes.
 */
export const phaseInfo: Record<CyclePhase, { label: string; food: string; training: string; extraKcal: number }> = {
  menstrual: {
    label: 'Menstrual',
    food: 'Prioriza alimentos con hierro (legumbres, carne roja, espinacas) junto con vitamina C.',
    training: 'Mantén el plan; si hay molestias, baja la intensidad sin saltarte la sesión.',
    extraKcal: 0,
  },
  folicular: {
    label: 'Folicular',
    food: 'Plan estándar.',
    training: 'Buena fase para subir pesos y hacer series de calidad.',
    extraKcal: 0,
  },
  ovulatoria: {
    label: 'Ovulación',
    food: 'Plan estándar.',
    training: 'Cuida bien el calentamiento antes de cargar peso.',
    extraKcal: 0,
  },
  lutea: {
    label: 'Lútea',
    food: 'El gasto sube un poco y suele haber más hambre: déficit más suave, más fibra y proteína, snacks saciantes.',
    training: 'El esfuerzo se nota más; prioriza mantener los pesos.',
    extraKcal: 150,
  },
}

/** Media de los últimos ciclos registrados (entre 21 y 40 días), o el valor por defecto. */
export function averageCycleLength(starts: DayString[], fallback: number): number {
  const sorted = [...starts].sort()
  const lengths = sorted
    .slice(1)
    .map((s, i) => daysBetween(sorted[i], s))
    .filter((d) => d >= 21 && d <= 40)
    .slice(-6)
  if (lengths.length === 0) return fallback
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
}

export function cycleInfo(day: DayString, starts: DayString[], fallbackLength = 28, periodLength = 5): CycleInfo | undefined {
  const last = [...starts].filter((s) => s <= day).sort().at(-1)
  if (!last) return undefined
  const cycleLength = averageCycleLength(starts, fallbackLength)
  // Más allá del último ciclo registrado se prevé con la duración media.
  const sinceLast = daysBetween(last, day)
  const dayOfCycle = (sinceLast % cycleLength) + 1
  const ovulation = cycleLength - 14
  let phase: CyclePhase
  if (dayOfCycle <= periodLength) phase = 'menstrual'
  else if (dayOfCycle < ovulation - 1) phase = 'folicular'
  else if (dayOfCycle <= ovulation + 1) phase = 'ovulatoria'
  else phase = 'lutea'
  return { dayOfCycle, cycleLength, phase, nextPeriod: addDays(day, cycleLength - dayOfCycle + 1) }
}

export function cycleFor(day: DayString, profile: Profile, starts: DayString[]): CycleInfo | undefined {
  return cycleInfo(day, starts, profile.cycleLengthDays ?? 28, profile.periodLengthDays ?? 5)
}

/** Déficit del día: más suave en la fase lútea si el ajuste está activado. */
export function deficitFor(profile: Profile, cycle: CycleInfo | undefined): number {
  if (!cycle || profile.cycleAdjust === false) return profile.deficitKcal
  return Math.max(profile.deficitKcal - phaseInfo[cycle.phase].extraKcal, 0)
}

