import { describe, expect, it } from 'vitest'
import { findFood, nutritionFromText } from '../foods'

describe('findFood', () => {
  it('reconoce plurales y la clave más larga', () => {
    expect(findFood('Huevos')?.name).toBe(findFood('huevo')?.name)
    expect(findFood('Aceite de oliva')?.keys.some((k) => k.includes('aceite'))).toBe(true)
    expect(findFood('Pechuga de pollo')).toBeDefined()
  })

  it('no inventa alimentos', () => {
    expect(findFood('Xyzzy')).toBeUndefined()
  })
})

describe('nutritionFromText', () => {
  it('suma gramos, unidades y cucharadas', () => {
    const r = nutritionFromText('100 g pechuga de pollo\n2 huevos\n1 cucharada de aceite de oliva')
    expect(r.lines).toHaveLength(3)
    expect(r.lines.every((l) => l.food && l.grams)).toBe(true)
    expect(r.lines[2].grams).toBe(12)
    expect(r.lines[2].ingredient.name).toBe('Aceite de oliva')
    // ~110 pollo + ~145 dos huevos + ~108 aceite
    expect(r.kcal).toBeGreaterThan(320)
    expect(r.kcal).toBeLessThan(420)
    expect(r.proteinG).toBeGreaterThan(30)
  })

  it('convierte kg y acepta "media cucharadita"', () => {
    const r = nutritionFromText('0,2 kg arroz\nmedia cucharadita de aceite')
    expect(r.lines[0].grams).toBe(200)
    expect(r.lines[1].grams).toBe(2.5)
  })

  it('lo desconocido cuenta 0 y se marca', () => {
    const r = nutritionFromText('100 g algo raro')
    expect(r.kcal).toBe(0)
    expect(r.lines[0].food).toBeUndefined()
  })

  it('sin texto da 0', () => {
    expect(nutritionFromText('').kcal).toBe(0)
  })
})
