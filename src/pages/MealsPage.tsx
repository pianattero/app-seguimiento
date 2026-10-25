import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, Page } from '../components/ui'
import { addDays, daysOfWeek, parseDay, today, weekTitle } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { fillWeek, mealNutrition, totals } from '../lib/meals'
import { sessionsInWeek } from '../lib/planner'
import { getRecipe, mealSlots, slotLabel } from '../lib/recipes'
import type { Meal } from '../lib/types'

const shortDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })

/** Menú semanal en forma de calendario: una columna por día y una fila por comida. */
export function MealsPage({ weekStart }: { weekStart: string }) {
  const weekEnd = addDays(weekStart, 7)
  const meals = useLiveQuery(() => db.meals.where('day').between(weekStart, weekEnd).toArray(), [weekStart]) ?? []
  const profile = useLiveQuery(() => db.profile.get('main'))
  const sessions = useLiveQuery(() => sessionsInWeek(weekStart), [weekStart]) ?? []
  const periods = useLiveQuery(() => db.periods.toArray()) ?? []
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)
  const days = daysOfWeek(weekStart)

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
          <a className="icon-button" href={`#/comidas?w=${addDays(weekStart, -7)}`} aria-label="Semana anterior"><Icon name="left" /></a>
          <a className="icon-button" href={`#/comidas?w=${addDays(weekStart, 7)}`} aria-label="Semana siguiente"><Icon name="right" /></a>
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
      </div>

      <div className="calendar-scroll" role="grid" aria-label="Menú de la semana">
        <div className="meal-grid">
          <div className="meal-grid-corner" />
          {days.map((day) => {
            const planned = totals(meals.filter((m) => m.day === day))
            const target = profile ? planForDay(day, profile, sessions, periods.map((p) => p.start)).target.kcal : undefined
            const over = target !== undefined && planned.kcal > target * 1.1
            return (
              <div key={day} className={`meal-grid-day${day === today() ? ' is-today' : ''}`} role="columnheader">
                <span className="weekday">{shortDay.format(parseDay(day)).replace('.', '')}</span>
                <span className="daynum">{parseDay(day).getDate()}</span>
                {target !== undefined && (
                  <span className={`kcal${over ? ' over' : ''}`}>{formatNumber(planned.kcal)}/{target}</span>
                )}
              </div>
            )
          })}
          {mealSlots.map((slot) => (
            <SlotRow key={slot} slot={slot} days={days} meals={meals} />
          ))}
        </div>
      </div>
      <p className="card-footer">Desliza para ver toda la semana. Toca una comida para cambiarla. Arriba: kcal planificadas / objetivo.</p>

      <Card>
        <a className="row row-link" href={`#/compra?w=${weekStart}`}><Icon name="cart" className="row-icon" /> Lista de la compra ›</a>
        <a className="row row-link" href="#/preferencias"><Icon name="ban" className="row-icon" /> Alimentos que no quieres ›</a>
        <a className="row row-link" href="#/receta-nueva"><Icon name="plus" className="row-icon" /> Añadir una receta propia ›</a>
      </Card>
    </Page>
  )
}

function SlotRow({ slot, days, meals }: { slot: Meal['slot']; days: string[]; meals: Meal[] }) {
  return (
    <>
      <div className={`meal-grid-slot slot-${slot}`} role="rowheader">{slotLabel[slot]}</div>
      {days.map((day) => {
        const meal = meals.find((m) => m.day === day && m.slot === slot)
        const recipe = meal?.recipeId ? getRecipe(meal.recipeId) : undefined
        const name = recipe?.name ?? meal?.customName
        return (
          <a key={day} className={`meal-cell slot-${slot}${meal ? '' : ' empty'}${day === today() ? ' is-today' : ''}`} href={`#/comida/${day}/${slot}`} role="gridcell">
            {name ? (
              <>
                <span className="meal-name">{name}</span>
                <span className="meal-kcal">{formatNumber(mealNutrition(meal!).kcal)} kcal</span>
              </>
            ) : (
              <span className="meal-add"><Icon name="plus" /></span>
            )}
          </a>
        )
      })}
    </>
  )
}

/** Fila de comida en formato lista (la usa la pantalla Hoy). */
export function MealRow({ day, slot, meal }: { day: string; slot: Meal['slot']; meal?: Meal }) {
  const recipe = meal?.recipeId ? getRecipe(meal.recipeId) : undefined
  const name = recipe?.name ?? meal?.customName
  const kcal = meal ? mealNutrition(meal).kcal : 0
  return (
    <a className="row row-link" href={`#/comida/${day}/${slot}`}>
      <span className="row-main">
        <small className={`slot-pill slot-${slot}`}>{slotLabel[slot]}</small>
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
