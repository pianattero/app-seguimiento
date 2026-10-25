import { addDays, daysOfWeek, startOfWeek } from './dates'
import { db as defaultDb, type AppDB } from './db'
import type { ImportedWorkout, Session, StrengthSet } from './types'
import { weekPlan } from './weekTemplate'

export function sessionsInWeek(weekStart: string, db: AppDB = defaultDb): Promise<Session[]> {
  return db.sessions.where('day').between(weekStart, addDays(weekStart, 7)).sortBy('day')
}

/** Añade las sesiones de la plantilla que falten en la semana. */
export async function ensureWeek(weekStart: string, db: AppDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const existing = await sessionsInWeek(weekStart, db)
    for (const [index, day] of daysOfWeek(weekStart).entries()) {
      for (const kind of weekPlan[index] ?? []) {
        if (existing.some((s) => s.day === day && s.kind === kind && !s.isExtra)) continue
        await db.sessions.add({ day, kind, status: 'planned', isExtra: false })
      }
    }
  })
}

function workoutFields(w: ImportedWorkout): Partial<Session> {
  return {
    externalId: w.externalId,
    startedAt: w.startedAt,
    durationMin: w.durationMin,
    distanceKm: w.distanceKm,
    activeKcal: w.activeKcal,
    avgHeartRate: w.avgHeartRate,
    maxHeartRate: w.maxHeartRate,
    status: 'done',
  }
}

/**
 * Asigna un entreno importado a la sesión prevista de ese día y tipo; si no hay, crea un extra.
 * Importar el mismo entreno dos veces actualiza la misma sesión.
 */
export async function mergeWorkout(w: ImportedWorkout, db: AppDB = defaultDb): Promise<number> {
  // La semana del entreno puede no existir aún (p. ej. si es la primera vez que se abre la app esa semana).
  await ensureWeek(startOfWeek(w.day), db)
  return db.transaction('rw', db.sessions, async () => {
    const linked = await db.sessions.where('externalId').equals(w.externalId).first()
    if (linked?.id !== undefined) {
      await db.sessions.update(linked.id, workoutFields(w))
      return linked.id
    }
    const sameDay = await db.sessions.where('day').equals(w.day).toArray()
    // Incluye sesiones ya marcadas como hechas a mano: los datos del Watch las completan.
    const planned = sameDay.find((s) => s.kind === w.kind && !s.externalId)
    if (planned?.id !== undefined) {
      await db.sessions.update(planned.id, workoutFields(w))
      return planned.id
    }
    return db.sessions.add({ day: w.day, kind: w.kind, isExtra: true, ...workoutFields(w) } as Session) as Promise<number>
  })
}

/** Última serie registrada de un ejercicio fuera de la sesión actual, para precargar el peso. */
export async function lastSet(exerciseName: string, excludingSessionId: number, db: AppDB = defaultDb): Promise<StrengthSet | undefined> {
  const sets = await db.sets.where('exerciseName').equals(exerciseName).reverse().sortBy('createdAt')
  return sets.find((s) => s.sessionId !== excludingSessionId)
}

/** Mejor peso levantado en un ejercicio. */
export async function bestWeight(exerciseName: string, db: AppDB = defaultDb): Promise<number | undefined> {
  const sets = await db.sets.where('exerciseName').equals(exerciseName).toArray()
  return sets.length ? Math.max(...sets.map((s) => s.weightKg)) : undefined
}

/** Nueva serie precargada con la anterior de la sesión o con la última vez que se hizo el ejercicio. */
export async function addSet(sessionId: number, exerciseName: string, db: AppDB = defaultDb): Promise<number> {
  const inSession = await db.sets.where('sessionId').equals(sessionId).toArray()
  const previous = inSession.filter((s) => s.exerciseName === exerciseName).sort((a, b) => a.order - b.order).at(-1)
    ?? (await lastSet(exerciseName, sessionId, db))
  const order = inSession.reduce((max, s) => Math.max(max, s.order), -1) + 1
  return db.sets.add({
    sessionId,
    exerciseName,
    reps: previous?.reps ?? 10,
    weightKg: previous?.weightKg ?? 0,
    order,
    createdAt: Date.now(),
  }) as Promise<number>
}

export async function deleteSession(id: number, db: AppDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.sessions, db.sets, async () => {
    await db.sets.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
  })
}
