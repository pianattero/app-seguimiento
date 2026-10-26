import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Card, MacroBar, Page } from '../components/ui'
import { addDays, daysOfWeek, parseDay, today, weekTitle } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { formatNumber } from '../lib/format'
import { fillWeek, mealNutrition, mealTitle, totals } from '../lib/meals'
import { sessionsInWeek } from '../lib/planner'
import { getRecipe, mealSlots, slotLabel } from '../lib/recipes'
import type { DayTarget } from '../lib/nutrition'
import type { Meal } from '../lib/types'

const shortDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const longDay = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

const VIEW_KEY = 'comidas-vista'
function savedView(): 'dia' | 'semana' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'dia' ? 'dia' : 'semana'
  } catch {
    return 'semana'
  }
}

/** Menú semanal en forma de calendario: una columna por día y una fila por comida. */
export function MealsPage({ weekStart }: { weekStart: string }) {
  const weekEnd = addDays(weekStart, 7)
  const meals = useLiveQuery(() => db.meals.where('day').between(weekStart, weekEnd).toArray(), [weekStart]) ?? []
  const profile = useLiveQuery(() => db.profile.get('main'))
  const sessions = useLiveQuery(() => sessionsInWeek(weekStart), [weekStart]) ?? []
  const periods = useLiveQuery(() => db.periods.toArray()) ?? []
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'dia' | 'semana'>(savedView)
  const days = daysOfWeek(weekStart)
  const [picked, setSelected] = useState<string>()
  // Al cambiar de semana, el día elegido vuelve a hoy (o al lunes si hoy no está en esa semana).
  const selected = picked && days.includes(picked) ? picked : days.includes(today()) ? today() : weekStart
  const periodStarts = periods.map((p) => p.start)
  const targetFor = (day: string) => (profile ? planForDay(day, profile, sessions, periodStarts).target : undefined)

  function changeView(v: 'dia' | 'semana') {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // Sin almacenamiento (modo privado): la vista simplemente no se recuerda.
    }
  }

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

      <div className="segmented view-switch" role="radiogroup" aria-label="Vista del menú">
        <button role="radio" aria-checked={view === 'dia'} className={view === 'dia' ? 'selected' : ''} onClick={() => changeView('dia')}>
          <Icon name="list" /> Día
        </button>
        <button role="radio" aria-checked={view === 'semana'} className={view === 'semana' ? 'selected' : ''} onClick={() => changeView('semana')}>
          <Icon name="calendar" /> Semana
        </button>
      </div>

      {view === 'dia' ? (
        <DayView days={days} selected={selected} onSelect={setSelected} meals={meals} targetFor={targetFor} />
      ) : (
        <>
          <div className="calendar-scroll" role="grid" aria-label="Menú de la semana">
            <div className="meal-grid">
              <div className="meal-grid-corner" />
              {days.map((day) => {
                const planned = totals(meals.filter((m) => m.day === day))
                const target = targetFor(day)?.kcal
                const over = target !== undefined && planned.kcal > target * 1.1
                return (
                  <div key={day} className={`meal-grid-day${day === today() ? ' is-today' : ''}`} role="columnheader">
                    <span className="weekday">{shortDay.format(parseDay(day)).replace('.', '')}</span>
                    <span className="daynum">{parseDay(day).getDate()}</span>
                    {target !== undefined && (
                      <>
                        <span className={`kcal${over ? ' over' : ''}`}>{formatNumber(planned.kcal)}/{target}</span>
                        <span className="day-bar"><span className={over ? 'over' : ''} style={{ width: `${Math.min(planned.kcal / target, 1) * 100}%` }} /></span>
                      </>
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
        </>
      )}

      <Card>
        <a className="row row-link" href={`#/compra?w=${weekStart}`}><Icon name="cart" className="row-icon" /> Lista de la compra ›</a>
        <a className="row row-link" href="#/receta-nueva"><Icon name="plus" className="row-icon" /> Añadir una receta propia ›</a>
      </Card>
    </Page>
  )
}

/** Un día del menú en grande: tira con los 7 días, calorías del día y una tarjeta por comida. */
function DayView({ days, selected, onSelect, meals, targetFor }: {
  days: string[]
  selected: string
  onSelect: (day: string) => void
  meals: Meal[]
  targetFor: (day: string) => DayTarget | undefined
}) {
  const dayMeals = meals.filter((m) => m.day === selected)
  const planned = totals(dayMeals)
  const target = targetFor(selected)
  return (
    <>
      <div className="day-strip" role="tablist" aria-label="Días de la semana">
        {days.map((day) => {
          const kcal = totals(meals.filter((m) => m.day === day)).kcal
          const t = targetFor(day)?.kcal
          return (
            <button
              key={day}
              role="tab"
              aria-selected={day === selected}
              className={`day-pill${day === selected ? ' selected' : ''}${day === today() ? ' is-today' : ''}`}
              onClick={() => onSelect(day)}
            >
              <span className="weekday">{shortDay.format(parseDay(day)).replace('.', '')}</span>
              <span className="daynum">{parseDay(day).getDate()}</span>
              <span className={`day-dot${kcal === 0 ? ' empty' : t && kcal > t * 1.1 ? ' over' : ''}`} />
            </button>
          )
        })}
      </div>

      <section className="card-block">
        <div className="card-title">
          <h2>{longDay.format(parseDay(selected)).replace(/^./, (c) => c.toUpperCase())}</h2>
          {target && <span className="muted">{formatNumber(planned.kcal)} / {target.kcal} kcal</span>}
        </div>
        {target && dayMeals.length > 0 && (
          <div className="card day-macros">
            <MacroBar label="Proteína" value={planned.proteinG} max={target.proteinG} color="var(--pink)" />
            <MacroBar label="Hidratos" value={planned.carbsG} max={target.carbsG} color="var(--yellow)" />
            <MacroBar label="Grasa" value={planned.fatG} max={target.fatG} color="var(--blue)" />
          </div>
        )}
        <div className="meal-cards">
          {mealSlots.map((slot) => {
            const meal = dayMeals.find((m) => m.slot === slot)
            const { name, side } = meal ? mealTitle(meal) : {}
            return (
              <a key={slot} className={`meal-card slot-${slot}${meal ? '' : ' empty'}`} href={`#/comida/${selected}/${slot}`}>
                <span className="meal-card-head">
                  <span className="meal-card-slot">{slotLabel[slot]}</span>
                  {meal && <span className="meal-card-kcal">{formatNumber(mealNutrition(meal).kcal)} kcal</span>}
                </span>
                {name ? (
                  <>
                    <strong className="meal-card-name">{name}</strong>
                    {side && <span className="meal-card-side">con {side.toLowerCase()}</span>}
                  </>
                ) : (
                  <span className="meal-card-add"><Icon name="plus" /> Elegir comida</span>
                )}
              </a>
            )
          })}
        </div>
      </section>
    </>
  )
}

function SlotRow({ slot, days, meals }: { slot: Meal['slot']; days: string[]; meals: Meal[] }) {
  return (
    <>
      <div className={`meal-grid-slot slot-${slot}`} role="rowheader">{slotLabel[slot]}</div>
      {days.map((day) => {
        const meal = meals.find((m) => m.day === day && m.slot === slot)
        const { name, side } = meal ? mealTitle(meal) : {}
        return (
          <a key={day} className={`meal-cell slot-${slot}${meal ? '' : ' empty'}${day === today() ? ' is-today' : ''}`} href={`#/comida/${day}/${slot}`} role="gridcell">
            {name ? (
              <>
                <span className="meal-name">{name}</span>
                {side && <span className="meal-side">+ {side}</span>}
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
  const { name, side } = meal ? mealTitle(meal) : {}
  const kcal = meal ? mealNutrition(meal).kcal : 0
  return (
    <a className="row row-link" href={`#/comida/${day}/${slot}`}>
      <span className="row-main">
        <small className={`slot-pill slot-${slot}`}>{slotLabel[slot]}</small>
        {name ? <span>{name}{side && <small className="muted"> + {side.toLowerCase()}</small>}</span> : <span className="muted">Elegir…</span>}
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
