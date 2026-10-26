import { addDays, daysBetween, weekdayIndex, type DayString } from './dates'
import { db as defaultDb, type AppDB } from './db'
import type { WeightEntry } from './types'

/** El domingo de esa semana si ya pasó, o el anterior: el día que toca pesarse. */
export function weighInDay(day: DayString): DayString {
  return weekdayIndex(day) === 6 ? day : addDays(day, -(weekdayIndex(day) + 1))
}

/** Toca pesarse si es domingo y aún no hay dato, o si el último pesaje tiene más de una semana. */
export function needsWeighIn(entries: WeightEntry[], day: DayString): boolean {
  if (entries.some((e) => e.day === day)) return false
  const last = entries.map((e) => e.day).filter((d) => d <= day).sort().at(-1)
  return weekdayIndex(day) === 6 || !last || daysBetween(last, day) > 7
}

export interface WeightStats {
  first: WeightEntry
  last: WeightEntry
  change: number
  /** kg por semana en las últimas 4 semanas (pendiente de la recta), si hay al menos 2 pesajes. */
  weeklyRate?: number
}

export function weightStats(entries: WeightEntry[]): WeightStats | undefined {
  const sorted = [...entries].sort((a, b) => a.day.localeCompare(b.day))
  if (sorted.length === 0) return undefined
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const recent = sorted.filter((e) => daysBetween(e.day, last.day) <= 28)
  let weeklyRate: number | undefined
  if (recent.length >= 2) {
    const xs = recent.map((e) => daysBetween(recent[0].day, e.day) / 7)
    const ys = recent.map((e) => e.kg)
    const mx = xs.reduce((a, b) => a + b) / xs.length
    const my = ys.reduce((a, b) => a + b) / ys.length
    const den = xs.reduce((t, x) => t + (x - mx) ** 2, 0)
    weeklyRate = den ? xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / den : undefined
  }
  return { first, last, change: last.kg - first.kg, weeklyRate }
}

/** Guarda un pesaje y, si es el más reciente, actualiza el peso del perfil para recalcular las calorías. */
export async function saveWeight(day: DayString, kg: number, db: AppDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.weights, db.profile, async () => {
    await db.weights.put({ day, kg })
    const latest = await db.weights.orderBy('day').last()
    const profile = await db.profile.get('main')
    if (profile && latest?.day === day) await db.profile.update('main', { person: { ...profile.person, weightKg: kg } })
  })
}

/** Borra un pesaje; si era el más reciente, el perfil vuelve al peso del pesaje anterior. */
export async function deleteWeight(day: DayString, db: AppDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.weights, db.profile, async () => {
    const latestBefore = await db.weights.orderBy('day').last()
    await db.weights.delete(day)
    const latest = await db.weights.orderBy('day').last()
    const profile = await db.profile.get('main')
    if (profile && latest && latestBefore?.day === day) await db.profile.update('main', { person: { ...profile.person, weightKg: latest.kg } })
  })
}
