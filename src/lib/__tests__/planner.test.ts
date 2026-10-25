import { beforeEach, describe, expect, it } from 'vitest'
import { AppDB, seedIfNeeded } from '../db'
import { addSet, ensureWeek, lastSet, mergeWorkout, sessionsInWeek } from '../planner'
import type { ImportedWorkout } from '../types'

const monday = '2026-10-26'
let db: AppDB
let n = 0

beforeEach(async () => {
  db = new AppDB(`test-${n++}`)
  await seedIfNeeded(db)
})

const run = (day: string, id: string): ImportedWorkout => ({
  externalId: id, kind: 'running', startedAt: `${day}T19:00:00Z`, day, durationMin: 30, distanceKm: 5, activeKcal: 380,
})

describe('planificación semanal', () => {
  it('crea la semana fija una sola vez', async () => {
    await ensureWeek(monday, db)
    await ensureWeek(monday, db)
    const sessions = await sessionsInWeek(monday, db)
    expect(sessions.map((s) => s.kind)).toEqual(['strength', 'running', 'strength', 'running'])
  })

  it('asigna el running del martes y crea un extra el sábado, sin duplicar', async () => {
    for (let i = 0; i < 2; i++) {
      await mergeWorkout(run('2026-10-27', 'a'), db)
      await mergeWorkout(run('2026-10-31', 'b'), db)
    }
    const sessions = await sessionsInWeek(monday, db)
    expect(sessions).toHaveLength(5)
    const tuesday = sessions.find((s) => s.externalId === 'a')!
    expect(tuesday).toMatchObject({ day: '2026-10-27', isExtra: false, status: 'done', distanceKm: 5 })
    expect(sessions.find((s) => s.externalId === 'b')).toMatchObject({ isExtra: true, status: 'done' })
  })

  it('precarga el peso de la última vez', async () => {
    const before = (await db.sessions.add({ day: '2026-10-19', kind: 'strength', status: 'done', isExtra: false })) as number
    const now = (await db.sessions.add({ day: monday, kind: 'strength', status: 'planned', isExtra: false })) as number
    await db.sets.add({ sessionId: before, exerciseName: 'Sentadilla', reps: 8, weightKg: 40, order: 0, createdAt: 1 })

    expect((await lastSet('Sentadilla', now, db))?.weightKg).toBe(40)
    const first = await db.sets.get(await addSet(now, 'Sentadilla', db))
    expect(first).toMatchObject({ reps: 8, weightKg: 40, order: 0 })

    await db.sets.update(first!.id!, { weightKg: 42.5 })
    const second = await db.sets.get(await addSet(now, 'Sentadilla', db))
    expect(second).toMatchObject({ weightKg: 42.5, order: 1 })
  })
})
