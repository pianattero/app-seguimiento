import { describe, expect, it } from 'vitest'
import { addDays, daysOfWeek, startOfWeek, weekdayIndex } from '../dates'

describe('fechas', () => {
  it('empieza la semana en lunes', () => {
    expect(startOfWeek('2026-10-29')).toBe('2026-10-26')
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26')
    expect(weekdayIndex('2026-10-26')).toBe(0)
  })

  it('cruza el cambio de hora sin saltarse días', () => {
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(daysOfWeek('2026-10-19').at(-1)).toBe('2026-10-25')
  })
})
