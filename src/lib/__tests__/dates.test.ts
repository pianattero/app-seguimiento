import { describe, expect, it } from 'vitest'
import { addDays, daysOfWeek, monthGrid, startOfWeek, weekdayIndex } from '../dates'

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

  it('arma el calendario del mes en semanas completas de lunes a domingo', () => {
    const { days, prev, next, title } = monthGrid('2026-10')
    expect(days[0]).toBe('2026-09-28')
    expect(days.at(-1)).toBe('2026-11-01')
    expect(days).toHaveLength(35)
    expect([prev, next]).toEqual(['2026-09', '2026-11'])
    expect(title).toBe('Octubre de 2026')
    expect(monthGrid('2026-12').next).toBe('2027-01')
  })
})
