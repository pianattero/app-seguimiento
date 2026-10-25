import { describe, expect, it } from 'vitest'
import { defaultProfile } from '../db'
import { averageCycleLength, cycleInfo, deficitFor } from '../cycle'

describe('ciclo menstrual', () => {
  it('calcula la duración media con los ciclos registrados', () => {
    expect(averageCycleLength(['2026-08-01', '2026-08-30', '2026-09-28'], 28)).toBe(29)
    expect(averageCycleLength(['2026-09-28'], 28)).toBe(28)
  })

  it('sabe en qué día y fase está', () => {
    const starts = ['2026-10-01']
    expect(cycleInfo('2026-10-03', starts)).toMatchObject({ dayOfCycle: 3, phase: 'menstrual' })
    expect(cycleInfo('2026-10-08', starts)).toMatchObject({ dayOfCycle: 8, phase: 'folicular' })
    expect(cycleInfo('2026-10-14', starts)).toMatchObject({ dayOfCycle: 14, phase: 'ovulatoria' })
    expect(cycleInfo('2026-10-20', starts)).toMatchObject({ dayOfCycle: 20, phase: 'lutea', nextPeriod: '2026-10-29' })
  })

  it('prevé los ciclos siguientes', () => {
    expect(cycleInfo('2026-10-31', ['2026-10-01'])).toMatchObject({ dayOfCycle: 3, phase: 'menstrual' })
    expect(cycleInfo('2026-09-15', ['2026-10-01'])).toBeUndefined()
  })

  it('suaviza el déficit en la fase lútea si está activado', () => {
    const lutea = cycleInfo('2026-10-20', ['2026-10-01'])
    expect(deficitFor(defaultProfile, lutea)).toBe(350)
    expect(deficitFor({ ...defaultProfile, cycleAdjust: false }, lutea)).toBe(500)
    expect(deficitFor(defaultProfile, cycleInfo('2026-10-08', ['2026-10-01']))).toBe(500)
  })
})
