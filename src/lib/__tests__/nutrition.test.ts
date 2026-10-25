import { describe, expect, it } from 'vitest'
import { bmr, dayTarget, portionFactor } from '../nutrition'
import type { PersonData } from '../types'

const mujer: PersonData = { sex: 'female', ageYears: 27, weightKg: 88.5, heightCm: 170 }
const partner: PersonData = { sex: 'male', ageYears: 30, weightKg: 90, heightCm: 172 }

describe('nutrición', () => {
  it('calcula el metabolismo basal con Mifflin-St Jeor', () => {
    expect(bmr(mujer)).toBeCloseTo(1651.5)
    expect(bmr(partner)).toBeCloseTo(1830)
  })

  it('no baja del mínimo en días de descanso', () => {
    expect(dayTarget(mujer, 0, 500, 1.5).kcal).toBe(1500)
  })

  it('da más calorías los días de entreno', () => {
    expect(dayTarget(mujer, 300, 500, 1.5).kcal).toBe(1737)
    expect(dayTarget(mujer, 400, 500, 1.5).kcal).toBe(1822)
  })

  it('reparte las calorías en macros', () => {
    const t = dayTarget(mujer, 400, 500, 1.5)
    expect(t.proteinG).toBe(133)
    expect(Math.abs(t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9 - t.kcal)).toBeLessThan(15)
  })

  it('sugiere 1,2 raciones para la segunda persona', () => {
    expect(portionFactor(partner, mujer, 500)).toBe(1.2)
  })
})
