import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, Page } from '../components/ui'
import { addDays, dayTitle, daysOfWeek, today, weekTitle } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { fillWeek, mealNutrition, totals } from '../lib/meals'
import { sessionsInWeek } from '../lib/planner'
import { mealSlots, recipeById, slotLabel } from '../lib/recipes'
import type { Meal } from '../lib/types'

export function MealsPage({ weekStart }: { weekStart: string }) {
  const weekEnd = addDays(weekStart, 7)
  const meals = useLiveQuery(() => db.meals.where('day').between(weekStart, weekEnd).toArray(), [weekStart]) ?? []
  const profile = useLiveQuery(() => db.profile.get('main'))
  const sessions = useLiveQuery(() => sessionsInWeek(weekStart), [weekStart]) ?? []
  const periods = useLiveQuery(() => db.periods.toArray()) ?? []
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)

  async function fill(replace: boolean) {
    setBusy(true)
    await fillWeek(weekStart, { replace })
    setBusy(false)
    setConfirmReplace(false)
  }

  return (
    <Page
      title={weekTitle(weekStart)}
      actions={
        <>
          <a className="icon-button" href={`#/comidas?w=${addDays(weekStart, -7)}`} aria-label="Semana anterior">‹</a>
          <a className="icon-button" href={`#/comidas?w=${addDays(weekStart, 7)}`} aria-label="Semana siguiente">›</a>
        </>
      }
    >
      <div className="button-row">
        {meals.length < 28 && (
          <button className="primary" disabled={busy} onClick={() => fill(false)}>
            {meals.length === 0 ? 'Generar menú' : 'Completar huecos'}
          </button>
        )}
        {meals.length > 0 && (
          <button disabled={busy} onClick={() => (confirmReplace ? fill(true) : setConfirmReplace(true))}>
            {confirmReplace ? 'Pulsa otra vez para rehacer' : 'Rehacer semana'}
          </button>
        )}
        <a className="button-link" href={`#/compra?w=${weekStart}`}>🛒 Lista de la compra</a>
      </div>

      {daysOfWeek(weekStart).map((day) => {
        const dayMeals = meals.filter((m) => m.day === day)
        const planned = totals(dayMeals)
        const target = profile ? planForDay(day, profile, sessions, periods.map((p) => p.start)).target : undefined
        return (
          <Card
            key={day}
            title={`${dayTitle(day)}${day === today() ? ' · hoy' : ''}`}
            aside={target ? `${formatNumber(planned.kcal)} / ${target.kcal} kcal` : undefined}
          >
            {mealSlots.map((slot) => (
              <MealRow key={slot} day={day} slot={slot} meal={dayMeals.find((m) => m.slot === slot)} />
            ))}
          </Card>
        )
      })}
    </Page>
  )
}

export function MealRow({ day, slot, meal }: { day: string; slot: Meal['slot']; meal?: Meal }) {
  const recipe = meal?.recipeId ? recipeById.get(meal.recipeId) : undefined
  const name = recipe?.name ?? meal?.customName
  const kcal = meal ? mealNutrition(meal).kcal : 0
  return (
    <a className="row row-link" href={`#/comida/${day}/${slot}`}>
      <span className="row-main">
        <small className="muted">{slotLabel[slot]}</small>
        {name ? <span>{name}</span> : <span className="muted">Elegir…</span>}
      </span>
      {meal && (
        <span className="row-value">
          {recipe && meal.portions !== 1 ? `×${formatNumber(meal.portions, 2)} · ` : ''}
          {formatNumber(kcal)} kcal
        </span>
      )}
    </a>
  )
}
