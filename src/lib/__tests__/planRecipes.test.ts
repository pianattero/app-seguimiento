import { describe, expect, it } from 'vitest'
import { ingredientNutrition } from '../foods'
import { splitLegacyMeal } from '../db'
import { mealNutrition, pickRecipe, pickSide, shoppingList } from '../meals'
import { legacyPlanMeals, planRecipes } from '../planRecipes'
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
      const [min, max] = r.side ? [40, 300] : r.needsSide ? [150, 500] : r.slots.includes('almuerzo') ? [250, 650] : [100, 450]
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
      const guarnicion = pickSide(almuerzo, 'almuerzo', random)
      // Almuerzo con hidratos: en el plato o en la guarnición, pero no en los dos.
      expect(almuerzo.fromPlan && (!!almuerzo.withCarbs !== !!guarnicion?.withCarbs)).toBe(true)
      const cena = pickRecipe('cena', [], undefined, random, { planOnly: true, lightDinner: true })
      expect(cena.fromPlan && !cena.withCarbs && !pickSide(cena, 'cena', random, { lightDinner: true })?.withCarbs).toBe(true)
    }
  })

  it('las guarniciones no se eligen solas como comida', () => {
    for (const slot of ['desayuno', 'almuerzo', 'merienda', 'cena'] as const) {
      for (let i = 0; i < 20; i++) expect(pickRecipe(slot, [], undefined, () => i / 20).side).toBeFalsy()
    }
  })

  it('la guarnición suma kcal y entra en la lista de la compra', () => {
    const meal = { day: '2026-10-26', slot: 'almuerzo' as const, recipeId: 'plan-tarta-zapallito', sideId: 'plan-g-ensalada-lechuga-tomate', portions: 1 }
    const tarta = recipeById.get('plan-tarta-zapallito')!
    const ensalada = recipeById.get('plan-g-ensalada-lechuga-tomate')!
    expect(mealNutrition(meal).kcal).toBe(tarta.kcal + ensalada.kcal)
    const names = shoppingList([meal], 1).flatMap((s) => s.items.map((i) => i.name))
    expect(names).toContain('Lechuga')
    expect(names).toContain('Masa quebrada')
  })

  it('los platos combinados del primer menú pasan a plato + guarnición que existen', () => {
    for (const [old, { main, side }] of Object.entries(legacyPlanMeals)) {
      expect(recipeById.get(main), old).toBeDefined()
      expect(recipeById.get(side)?.side, old).toBe(true)
    }
    const meal = { recipeId: 'plan-pollo-papas-calabaza' as string | undefined, sideId: undefined as string | undefined }
    splitLegacyMeal(meal)
    expect(meal).toEqual({ recipeId: 'plan-pechuga-pollo', sideId: 'plan-g-papas-calabaza-horno' })
  })
})
