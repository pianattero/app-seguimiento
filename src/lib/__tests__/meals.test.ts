import { beforeEach, describe, expect, it } from 'vitest'
import { AppDB, seedIfNeeded } from '../db'
import { deleteCustomRecipe, fillWeek, shoppingList, suggestPortions, totals } from '../meals'
import { mealSlots, recipeById, recipes } from '../recipes'
import type { Meal } from '../types'

const monday = '2026-10-26'
let db: AppDB
let n = 0

beforeEach(async () => {
  db = new AppDB(`meals-${n++}`)
  await seedIfNeeded(db)
})

/** Generador pseudoaleatorio fijo para que las pruebas sean reproducibles. */
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('recetario', () => {
  it('tiene recetas para cada comida y macros coherentes', () => {
    for (const slot of mealSlots) expect(recipes.filter((r) => r.slots.includes(slot)).length).toBeGreaterThanOrEqual(5)
    for (const r of recipes) {
      const fromMacros = r.proteinG * 4 + r.carbsG * 4 + r.fatG * 9
      expect(Math.abs(fromMacros - r.kcal) / r.kcal, r.name).toBeLessThan(0.15)
    }
  })
})

describe('menú semanal', () => {
  it('ajusta las raciones a las calorías de la comida', () => {
    const lentejas = recipeById.get('lentejas-verduras')!
    expect(suggestPortions(lentejas, 525)).toBe(1.25)
    expect(suggestPortions(lentejas, 100)).toBe(0.75)
    expect(suggestPortions(lentejas, 2000)).toBe(1.5)
  })

  it('rellena las 4 comidas de los 7 días sin repetir la receta del día anterior', async () => {
    await fillWeek(monday, {}, db, seeded())
    const meals = await db.meals.toArray()
    expect(meals).toHaveLength(28)
    for (const m of meals) {
      const yesterday = meals.find((x) => x.slot === m.slot && x.day === addDay(m.day, -1))
      if (yesterday) expect(m.recipeId).not.toBe(yesterday.recipeId)
    }
  })

  it('se acerca al objetivo de calorías de cada día', async () => {
    await fillWeek(monday, {}, db, seeded(7))
    const meals = await db.meals.where('day').equals(monday).toArray()
    // Lunes de fuerza con perfil por defecto: unas 1.765 kcal
    expect(totals(meals).kcal).toBeGreaterThan(1400)
    expect(totals(meals).kcal).toBeLessThan(2100)
  })

  it('solo rellena huecos, salvo que se pida rehacer', async () => {
    await db.meals.add({ day: monday, slot: 'cena', customName: 'Cena fuera', customKcal: 700, portions: 1 })
    await fillWeek(monday, {}, db, seeded())
    expect(await db.meals.where('day').equals(monday).count()).toBe(4)
    expect((await db.meals.toArray()).some((m) => m.customName === 'Cena fuera')).toBe(true)
    await fillWeek(monday, { replace: true }, db, seeded())
    expect((await db.meals.toArray()).some((m) => m.customName === 'Cena fuera')).toBe(false)
  })
})

describe('lista de la compra', () => {
  it('suma ingredientes para los dos y redondea', () => {
    const meals: Meal[] = [
      { day: monday, slot: 'almuerzo', recipeId: 'lentejas-verduras', portions: 1 },
      { day: '2026-10-28', slot: 'almuerzo', recipeId: 'lentejas-verduras', portions: 1.25 },
      { day: monday, slot: 'desayuno', recipeId: 'tostada-huevo-aguacate', portions: 1 },
      { day: monday, slot: 'cena', customName: 'Cena fuera', portions: 1 },
    ]
    const list = shoppingList(meals, 1.2)
    const despensa = list.find((s) => s.section === 'Despensa')!.items
    // 70 g × (1 + 1,25) × 2,2 = 346,5 → 350 g
    expect(despensa.find((i) => i.name === 'Lentejas pardinas')).toMatchObject({ qty: 350, unit: 'g' })
    // 2 huevos × 2,2 = 4,4 → 5
    expect(list.find((s) => s.section === 'Lácteos y huevos')!.items.find((i) => i.name === 'Huevos')).toMatchObject({ qty: 5, unit: 'ud' })
  })
})

function addDay(day: string, delta: number) {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

describe('recetas propias', () => {
  it('al borrar una receta propia, sus comidas quedan como comidas libres con sus kcal', async () => {
    await db.customRecipes.put({
      id: 'propia-1', name: 'Tarta de prueba', slots: ['cena'], kcal: 400, proteinG: 20, carbsG: 30, fatG: 20, minutes: 30, ingredients: [], steps: [],
    })
    const mealId = (await db.meals.add({ day: monday, slot: 'cena', recipeId: 'propia-1', portions: 1.5 })) as number
    await deleteCustomRecipe('propia-1', db)
    expect(await db.customRecipes.count()).toBe(0)
    const meal = await db.meals.get(mealId)
    expect(meal?.recipeId).toBeUndefined()
    expect(meal?.customName).toBe('Tarta de prueba')
    expect(meal?.customKcal).toBe(600)
    expect(meal?.customProteinG).toBe(30)
    expect(meal?.portions).toBe(1)
  })
})
