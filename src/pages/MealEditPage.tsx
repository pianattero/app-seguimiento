import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, NumberInput, Page, Row } from '../components/ui'
import { dayTitle, startOfWeek } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { mealNutrition, suggestPortions } from '../lib/meals'
import { recipeById, recipesFor, slotLabel, slotShare, type MealSlot, type Recipe } from '../lib/recipes'
import { navigate } from '../lib/router'
import { sessionsInWeek } from '../lib/planner'

/** Elegir o cambiar la receta de una comida concreta. */
export function MealEditPage({ day, slot }: { day: string; slot: MealSlot }) {
  const meal = useLiveQuery(async () => (await db.meals.where('day').equals(day).toArray()).find((m) => m.slot === slot) ?? null, [day, slot])
  const slotKcal = useLiveQuery(async () => {
    const profile = await db.profile.get('main')
    if (!profile) return undefined
    const sessions = await sessionsInWeek(startOfWeek(day))
    const periods = (await db.periods.toArray()).map((p) => p.start)
    return planForDay(day, profile, sessions, periods).target.kcal * slotShare[slot]
  }, [day, slot])
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState<number>()

  const back = `#/comidas?w=${startOfWeek(day)}`
  const recipe = meal?.recipeId ? recipeById.get(meal.recipeId) : undefined

  async function choose(r: Recipe) {
    const portions = slotKcal ? suggestPortions(r, slotKcal) : 1
    if (meal?.id) await db.meals.update(meal.id, { recipeId: r.id, customName: undefined, customKcal: undefined, portions })
    else await db.meals.add({ day, slot, recipeId: r.id, portions })
    window.location.hash = back
  }

  async function saveCustom() {
    if (!customName.trim()) return
    const changes = { recipeId: undefined, customName: customName.trim(), customKcal, portions: 1 }
    if (meal?.id) await db.meals.update(meal.id, changes)
    else await db.meals.add({ day, slot, ...changes })
    window.location.hash = back
  }

  const setPortions = (p: number) => meal?.id && db.meals.update(meal.id, { portions: Math.min(Math.max(p, 0.25), 3) })

  return (
    <Page title={slotLabel[slot]} actions={<a className="text-button" href={back}>Menú</a>}>
      <p className="muted subtitle">
        {dayTitle(day)}
        {slotKcal ? ` · objetivo de esta comida: unas ${formatNumber(slotKcal)} kcal` : ''}
      </p>

      {meal && (
        <Card title="Ahora">
          <Row label={recipe?.name ?? meal.customName} value={`${formatNumber(mealNutrition(meal).kcal)} kcal`} />
          {recipe && (
            <>
              <div className="row">
                <span>Tus raciones</span>
                <span className="row-value">
                  <button className="icon-button" aria-label="Menos" onClick={() => setPortions(meal.portions - 0.25)}>−</button>
                  <strong>{formatNumber(meal.portions, 2)}</strong>
                  <button className="icon-button" aria-label="Más" onClick={() => setPortions(meal.portions + 0.25)}>+</button>
                </span>
              </div>
              <a className="row row-link" href={`#/receta/${recipe.id}?r=${meal.portions}`}>Ver receta e ingredientes ›</a>
            </>
          )}
          <button className="row row-button danger" onClick={async () => { await db.meals.delete(meal.id!); navigate(back.slice(1)) }}>
            Quitar esta comida
          </button>
        </Card>
      )}

      <Card title="Recetas">
        {recipesFor(slot).map((r) => (
          <button key={r.id} className={`row row-button recipe-option${r.id === recipe?.id ? ' selected' : ''}`} onClick={() => choose(r)}>
            <span className="row-main">
              <span>{r.name}{r.thermomix ? ' · Thermomix' : ''}</span>
              <small className="muted">{r.kcal} kcal · {r.proteinG} g proteína · {r.minutes} min</small>
            </span>
          </button>
        ))}
      </Card>

      <Card title="Otra cosa" footer="Para comidas fuera de casa o algo que no está en el recetario. No entra en la lista de la compra.">
        <label className="row">
          <span>Nombre</span>
          <input className="text-input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Cena fuera" />
        </label>
        <label className="row">
          <span>Calorías aprox.</span>
          <span className="row-value">
            <NumberInput ariaLabel="Calorías aproximadas" decimals={false} value={customKcal} onChange={setCustomKcal} />
            <span className="unit">kcal</span>
          </span>
        </label>
        <button className="row row-button" onClick={saveCustom}>Guardar</button>
      </Card>
    </Page>
  )
}
