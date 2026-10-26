import { addDays, daysOfWeek, type DayString } from './dates'
import { planForDay } from './dayPlan'
import { db as defaultDb, type AppDB } from './db'
import { ensureWeek, sessionsInWeek } from './planner'
import { allRecipes, getRecipe, mealSlots, recipesFor, setCustomRecipes, shopSections, slotShare, type Ingredient, type MealSlot, type Recipe, type ShopSection } from './recipes'
import type { Meal } from './types'

export interface Nutrition {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

const zero: Nutrition = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }

/** Lo que come la usuaria en una comida (sus raciones). */
export function mealNutrition(meal: Meal): Nutrition {
  const recipe = meal.recipeId ? getRecipe(meal.recipeId) : undefined
  if (!recipe) {
    return { kcal: meal.customKcal ?? 0, proteinG: meal.customProteinG ?? 0, carbsG: meal.customCarbsG ?? 0, fatG: meal.customFatG ?? 0 }
  }
  return {
    kcal: recipe.kcal * meal.portions,
    proteinG: recipe.proteinG * meal.portions,
    carbsG: recipe.carbsG * meal.portions,
    fatG: recipe.fatG * meal.portions,
  }
}

export function totals(meals: Meal[]): Nutrition {
  return meals.map(mealNutrition).reduce(
    (t, n) => ({ kcal: t.kcal + n.kcal, proteinG: t.proteinG + n.proteinG, carbsG: t.carbsG + n.carbsG, fatG: t.fatG + n.fatG }),
    zero,
  )
}

/** Raciones para acercarse a las kcal de la comida, en cuartos y entre 0,75 y 1,5. */
export function suggestPortions(recipe: Recipe, slotKcal: number): number {
  const raw = Math.round((slotKcal / recipe.kcal) * 4) / 4
  return Math.min(Math.max(raw, 0.75), 1.5)
}

export interface PickOptions {
  excluded?: string[]
  /** Solo recetas del plan de alimentación, si hay suficientes. */
  planOnly?: boolean
  /** Cena sin hidratos (días sin running, según el plan). */
  lightDinner?: boolean
}

/** Elige una receta variada para una comida: sin repetir la del día anterior y como mucho 2 veces por semana. */
export function pickRecipe(slot: MealSlot, usedThisWeek: string[], yesterday: string | undefined, random: () => number, options: PickOptions = {}): Recipe {
  const allowed = recipesFor(slot, options.excluded)
  let all = allowed.length ? allowed : allRecipes().filter((r) => r.slots.includes(slot))
  // Se aplica cada preferencia solo si deja al menos 3 opciones, para no repetir siempre lo mismo.
  const narrow = (keep: (r: Recipe) => boolean) => {
    const kept = all.filter(keep)
    if (kept.length >= 3) all = kept
  }
  if (options.planOnly) narrow((r) => !!r.fromPlan)
  // Plan: el almuerzo lleva su ¼ de hidratos; la cena, solo los días de running.
  if (slot === 'almuerzo' && options.planOnly) narrow((r) => !!r.withCarbs)
  if (slot === 'cena' && options.lightDinner) narrow((r) => !r.withCarbs && r.carbsG <= 30)
  const count = (id: string) => usedThisWeek.filter((u) => u === id).length
  const fresh = all.filter((r) => r.id !== yesterday && count(r.id) < 2)
  const pool = fresh.length ? fresh : all
  return pool[Math.floor(random() * pool.length) % pool.length]
}

/**
 * Rellena el menú de la semana según las calorías de cada día.
 * Por defecto solo los huecos vacíos; con `replace` rehace toda la semana.
 */
export async function fillWeek(
  weekStart: DayString,
  options: { replace?: boolean } = {},
  db: AppDB = defaultDb,
  random: () => number = Math.random,
): Promise<void> {
  await ensureWeek(weekStart, db)
  const profile = await db.profile.get('main')
  if (!profile) return
  setCustomRecipes(await db.customRecipes.toArray())
  const sessions = await sessionsInWeek(weekStart, db)
  const periodStarts = (await db.periods.toArray()).map((p) => p.start)
  const weekEnd = addDays(weekStart, 7)
  // Según el plan, los días de running la cena puede llevar hidratos como el almuerzo.
  const runningDay = (day: DayString) => sessions.some((s) => s.day === day && s.kind === 'running' && s.status !== 'skipped')

  await db.transaction('rw', db.meals, async () => {
    if (options.replace) await db.meals.where('day').between(weekStart, weekEnd).delete()
    const existing = await db.meals.where('day').between(weekStart, weekEnd).toArray()
    const used: Record<MealSlot, string[]> = { desayuno: [], almuerzo: [], merienda: [], cena: [] }
    for (const m of existing) if (m.recipeId) used[m.slot].push(m.recipeId)

    for (const day of daysOfWeek(weekStart)) {
      const { target } = planForDay(day, profile, sessions, periodStarts)
      for (const slot of mealSlots) {
        if (existing.some((m) => m.day === day && m.slot === slot)) continue
        const yesterday = existing.find((m) => m.day === addDays(day, -1) && m.slot === slot)?.recipeId
        const recipe = pickRecipe(slot, used[slot], yesterday, random, {
          excluded: profile.excludedFoods,
          planOnly: profile.menuSource !== 'todo',
          lightDinner: !runningDay(day),
        })
        const meal: Meal = { day, slot, recipeId: recipe.id, portions: suggestPortions(recipe, target.kcal * slotShare[slot]) }
        await db.meals.add(meal)
        existing.push(meal)
        used[slot].push(recipe.id)
      }
    }
  })
}

export interface ShoppingItem {
  key: string
  name: string
  qty: number
  unit: Ingredient['unit']
}

/** Lista de la compra para los dos: raciones de la usuaria × (1 + factor de la otra persona). */
export function shoppingList(meals: Meal[], partnerFactor: number): { section: ShopSection; items: ShoppingItem[] }[] {
  const items = new Map<string, ShoppingItem & { section: ShopSection }>()
  for (const meal of meals) {
    const recipe = meal.recipeId ? getRecipe(meal.recipeId) : undefined
    if (!recipe) continue
    const portions = meal.portions * (1 + partnerFactor)
    for (const ing of recipe.ingredients) {
      const key = `${ing.name}|${ing.unit}`
      const item = items.get(key) ?? { key, name: ing.name, qty: 0, unit: ing.unit, section: ing.section }
      item.qty += ing.qty * portions
      items.set(key, item)
    }
  }
  return shopSections
    .map((section) => ({
      section,
      items: [...items.values()]
        .filter((i) => i.section === section)
        .map(({ key, name, qty, unit }) => ({ key, name, unit, qty: unit === 'ud' ? Math.ceil(qty - 0.01) : Math.ceil(qty / 10) * 10 }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }))
    .filter((s) => s.items.length > 0)
}
