import { describe, expect, it } from 'vitest'
import { ingredientNutrition } from '../foods'
import { pickRecipe } from '../meals'
import { planRecipes } from '../planRecipes'
import { recipeById } from '../recipes'

describe('recetas del plan', () => {
  it('todos los ingredientes se reconocen y tienen gramos', () => {
    for (const r of planRecipes) {
      for (const i of r.ingredients) {
        const n = ingredientNutrition(i)
        expect(n.food, `${r.name}: ${i.name}`).toBeDefined()
        expect(n.grams, `${r.name}: ${i.name}`).toBeGreaterThan(0)
      }
    }
  })

  it('kcal razonables por ración', () => {
    for (const r of planRecipes) {
      const [min, max] = r.slots.includes('almuerzo') ? [250, 650] : [100, 450]
      expect(r.kcal, r.name).toBeGreaterThanOrEqual(min)
      expect(r.kcal, r.name).toBeLessThanOrEqual(max)
    }
  })

  it('incluye las tartas', () => {
    for (const id of ['plan-tarta-jamon-queso', 'plan-tarta-zapallito', 'plan-pascualina']) expect(recipeById.get(id)?.slots).toContain('almuerzo')
  })

  it('el menú usa el plan y cenas sin hidratos los días sin running', () => {
    for (let i = 0; i < 30; i++) {
      const random = () => (i + 0.5) / 30
      const almuerzo = pickRecipe('almuerzo', [], undefined, random, { planOnly: true })
      expect(almuerzo.fromPlan && almuerzo.withCarbs).toBe(true)
      const cena = pickRecipe('cena', [], undefined, random, { planOnly: true, lightDinner: true })
      expect(cena.fromPlan && !cena.withCarbs).toBe(true)
    }
  })
})
