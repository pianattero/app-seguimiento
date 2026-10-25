import { describe, expect, it } from 'vitest'
import { AppDB, seedIfNeeded } from '../db'
import { needsWeighIn, saveWeight, weighInDay, weightStats } from '../weight'

describe('peso', () => {
  it('el día de pesarse es el domingo de la semana o el anterior', () => {
    expect(weighInDay('2026-10-25')).toBe('2026-10-25')
    expect(weighInDay('2026-10-27')).toBe('2026-10-25')
  })

  it('pide pesarse el domingo o si pasó más de una semana', () => {
    expect(needsWeighIn([], '2026-10-21')).toBe(true)
    expect(needsWeighIn([{ day: '2026-10-18', kg: 88 }], '2026-10-21')).toBe(false)
    expect(needsWeighIn([{ day: '2026-10-18', kg: 88 }], '2026-10-25')).toBe(true)
    expect(needsWeighIn([{ day: '2026-10-25', kg: 88 }], '2026-10-25')).toBe(false)
    expect(needsWeighIn([{ day: '2026-10-11', kg: 88 }], '2026-10-20')).toBe(true)
  })

  it('calcula el cambio total y el ritmo semanal', () => {
    const stats = weightStats([
      { day: '2026-10-25', kg: 87.5 },
      { day: '2026-10-11', kg: 88.5 },
      { day: '2026-10-18', kg: 88 },
    ])!
    expect(stats.first.kg).toBe(88.5)
    expect(stats.change).toBeCloseTo(-1)
    expect(stats.weeklyRate).toBeCloseTo(-0.5)
  })

  it('el último pesaje actualiza el peso del perfil', async () => {
    const db = new AppDB('peso-test')
    await seedIfNeeded(db)
    await saveWeight('2026-10-25', 87.6, db)
    await saveWeight('2026-10-18', 88.1, db)
    expect((await db.profile.get('main'))?.person.weightKg).toBe(87.6)
    expect(await db.weights.count()).toBe(2)
  })
})
