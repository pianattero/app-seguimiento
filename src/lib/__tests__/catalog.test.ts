import { afterEach, describe, expect, it } from 'vitest'
import { pickRecipe } from '../meals'
import { allRecipes, getRecipe, isAllowed, parseIngredientLines, recipesFor, searchRecipes, setCustomRecipes } from '../recipes'
import type { Recipe } from '../recipes'

const custom: Recipe = {
  id: 'propia-1',
  name: 'Tortilla de patatas de la abuela',
  slots: ['cena'],
  kcal: 450,
  proteinG: 22,
  carbsG: 35,
  fatG: 24,
  minutes: 30,
  ingredients: [{ name: 'patata', qty: 200, unit: 'g', section: 'Otros' }],
  steps: [],
}

afterEach(() => setCustomRecipes([]))

describe('filtro de alimentos', () => {
  it('oculta el curry aunque se escriba sin mayúsculas ni tildes', () => {
    const curry = getRecipe('pollo-curry-arroz')!
    expect(isAllowed(curry, ['Curry'])).toBe(false)
    expect(recipesFor('almuerzo', ['curry']).some((r) => r.id === curry.id)).toBe(false)
    expect(isAllowed(getRecipe('lubina-horno')!, ['champiñon'])).toBe(true)
  })

  it('los grupos excluyen todos sus alimentos', () => {
    const fish = recipesFor('cena', ['Pescado'])
    expect(fish.some((r) => r.id === 'merluza-papillote' || r.id === 'lubina-horno')).toBe(false)
    expect(fish.length).toBeGreaterThan(0)
  })

  it('el menú nunca usa una receta excluida si hay alternativas', () => {
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 50; i++) {
      expect(pickRecipe('almuerzo', [], undefined, random, ['curry']).id).not.toBe('pollo-curry-arroz')
    }
  })
})

describe('buscador', () => {
  it('encuentra por nombre o ingrediente, con todas las palabras', () => {
    expect(searchRecipes('salmon').length).toBeGreaterThan(0)
    expect(searchRecipes('pollo arroz').every((r) => /pollo/i.test(JSON.stringify(r)) && /arroz/i.test(JSON.stringify(r)))).toBe(true)
    expect(searchRecipes('curry', ['curry'])).toHaveLength(0)
  })

  it('incluye las recetas propias', () => {
    setCustomRecipes([custom])
    expect(searchRecipes('tortilla patatas').map((r) => r.id)).toContain('propia-1')
    expect(allRecipes()).toContainEqual(custom)
  })
})

describe('recetario', () => {
  it('desayunos y meriendas no usan Thermomix', () => {
    for (const r of allRecipes().filter((r) => r.slots.every((s) => s === 'desayuno' || s === 'merienda'))) {
      expect(r.thermomix ?? [], r.id).toHaveLength(0)
    }
  })
})

describe('ingredientes escritos a mano', () => {
  it('entiende cantidad, unidad y nombre', () => {
    const parsed = parseIngredientLines('200 g pollo\n2 huevos\n1 l leche\n\nsal')
    expect(parsed.map((i) => [i.qty, i.unit, i.name])).toEqual([
      [200, 'g', 'Pollo'],
      [2, 'ud', 'Huevos'],
      [1000, 'ml', 'Leche'],
      [1, 'ud', 'Sal'],
    ])
  })
})
