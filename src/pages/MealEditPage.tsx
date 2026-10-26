import { Icon } from '../components/Icon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { IngredientBreakdown } from '../components/IngredientBreakdown'
import { Card, NumberInput, Page, Row } from '../components/ui'
import { dayTitle, startOfWeek } from '../lib/dates'
import { planForDay } from '../lib/dayPlan'
import { db } from '../lib/db'
import { nutritionFromText } from '../lib/foods'
import { formatNumber } from '../lib/format'
import { mealNutrition, suggestPortions } from '../lib/meals'
import { sessionsInWeek } from '../lib/planner'
import { getRecipe, recipesFor, searchRecipes, slotLabel, slotShare, type MealSlot, type Recipe } from '../lib/recipes'
import { navigate } from '../lib/router'

const noCustom = {
  customName: undefined,
  customKcal: undefined,
  customProteinG: undefined,
  customCarbsG: undefined,
  customFatG: undefined,
  customIngredients: undefined,
}

/** Elegir o cambiar la receta de una comida: sugeridas, buscador y comida libre. */
export function MealEditPage({ day, slot }: { day: string; slot: MealSlot }) {
  const meal = useLiveQuery(async () => (await db.meals.where('day').equals(day).toArray()).find((m) => m.slot === slot) ?? null, [day, slot])
  const profile = useLiveQuery(() => db.profile.get('main'))
  const slotKcal = useLiveQuery(async () => {
    const p = await db.profile.get('main')
    if (!p) return undefined
    const sessions = await sessionsInWeek(startOfWeek(day))
    const periods = (await db.periods.toArray()).map((x) => x.start)
    return planForDay(day, p, sessions, periods).target.kcal * slotShare[slot]
  }, [day, slot])
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customKcal, setCustomKcal] = useState<number>()
  const [customIngredients, setCustomIngredients] = useState('')
  const calc = useMemo(() => nutritionFromText(customIngredients), [customIngredients])
  // Las kcal escritas a mano mandan; si no hay, se usan las de los ingredientes.
  const kcalForCustom = customKcal ?? (calc.kcal || undefined)

  // Al abrir una comida libre ya guardada, se rellenan sus datos para poder corregirlos.
  const mealId = meal?.id
  useEffect(() => {
    if (!meal?.customName) return
    setCustomName(meal.customName)
    setCustomIngredients(meal.customIngredients ?? '')
    const calculated = meal.customIngredients ? nutritionFromText(meal.customIngredients).kcal : undefined
    setCustomKcal(meal.customKcal === calculated ? undefined : meal.customKcal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealId])

  const back = `/comidas?w=${startOfWeek(day)}`
  const recipe = meal?.recipeId ? getRecipe(meal.recipeId) : undefined
  const excluded = profile?.excludedFoods ?? []

  const forSlot = recipesFor(slot, excluded)
  // Sugeridas: del plan de alimentación (salvo que en Ajustes se elija todo el recetario),
  // las que mejor encajan con las calorías de esta comida sin cambiar mucho las raciones.
  const fromPlan = forSlot.filter((r) => r.fromPlan)
  const pool = profile?.menuSource !== 'todo' && fromPlan.length >= 3 ? fromPlan : forSlot
  const suggested = slotKcal
    ? [...pool].sort((a, b) => Math.abs(Math.log(slotKcal / a.kcal)) - Math.abs(Math.log(slotKcal / b.kcal))).slice(0, 5)
    : pool.slice(0, 5)
  const results = query.trim() ? searchRecipes(query, excluded) : []

  async function choose(r: Recipe) {
    const portions = slotKcal ? suggestPortions(r, slotKcal) : 1
    if (meal?.id) await db.meals.update(meal.id, { recipeId: r.id, ...noCustom, portions })
    else await db.meals.add({ day, slot, recipeId: r.id, portions })
    navigate(back)
  }

  async function saveCustom() {
    if (!customName.trim()) return
    const fromIngredients = customKcal === undefined && calc.kcal > 0
    const changes = {
      ...noCustom,
      recipeId: undefined,
      customName: customName.trim(),
      customKcal: kcalForCustom,
      customIngredients: customIngredients.trim() || undefined,
      ...(fromIngredients ? { customProteinG: calc.proteinG, customCarbsG: calc.carbsG, customFatG: calc.fatG } : {}),
      portions: 1,
    }
    if (meal?.id) await db.meals.update(meal.id, changes)
    else await db.meals.add({ day, slot, ...changes })
    navigate(back)
  }

  const setPortions = (p: number) => meal?.id && db.meals.update(meal.id, { portions: Math.min(Math.max(p, 0.25), 3) })
  const option = (r: Recipe) => (
    <button key={r.id} className={`row row-button recipe-option${r.id === recipe?.id ? ' selected' : ''}`} onClick={() => choose(r)}>
      <span className="row-main">
        <span>{r.name}{r.thermomix && slot !== 'desayuno' && slot !== 'merienda' ? ' · Thermomix' : ''}{r.id.startsWith('propia-') ? ' · propia' : ''}{r.fromPlan ? ' · plan' : ''}</span>
        <small className="muted">{r.kcal} kcal · {r.proteinG} g proteína · {r.minutes} min</small>
      </span>
    </button>
  )

  return (
    <Page title={slotLabel[slot]} actions={<a className="text-button" href={`#${back}`}>Menú</a>}>
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
                  <button className="icon-button" aria-label="Menos" onClick={() => setPortions(meal.portions - 0.25)}><Icon name="minus" /></button>
                  <strong>{formatNumber(meal.portions, 2)}</strong>
                  <button className="icon-button" aria-label="Más" onClick={() => setPortions(meal.portions + 0.25)}><Icon name="plus" /></button>
                </span>
              </div>
              <a className="row row-link" href={`#/receta/${recipe.id}?r=${meal.portions}`}>Ver receta e ingredientes ›</a>
            </>
          )}
          <button className="row row-button danger" onClick={async () => { await db.meals.delete(meal.id!); navigate(back) }}>
            Quitar esta comida
          </button>
        </Card>
      )}

      <div className="search-box">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar receta o ingrediente: pollo, lentejas…"
          aria-label="Buscar receta"
        />
      </div>

      {query.trim() ? (
        <Card
          title={`Resultados (${results.length})`}
          footer={excluded.length ? `No se muestran recetas con: ${excluded.join(', ')}.` : undefined}
        >
          {results.map(option)}
          {results.length === 0 && <div className="row muted">No hay recetas con «{query}» en tu recetario.</div>}
          <a className="row row-link" href={`https://cookidoo.es/search/es-ES?query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">
            Buscar «{query}» en Cookidoo <Icon name="external" className="inline-icon" />
          </a>
          <a className="row row-link" href={`#/receta-nueva?slot=${slot}&nombre=${encodeURIComponent(query)}`}><Icon name="plus" className="row-icon" /> Crear «{query}» como receta propia</a>
        </Card>
      ) : (
        <>
          <Card title="Sugeridas" aside={pool === fromPlan ? 'de tu plan, según tus calorías' : 'encajan con tus calorías'}>
            {suggested.map(option)}
          </Card>
          <Card
            title={`Todas para ${slotLabel[slot].toLowerCase()} (${forSlot.length})`}
            footer={excluded.length ? `Ocultas por tus filtros: ${excluded.join(', ')}. Cámbialos en «Alimentos que no quieres».` : undefined}
          >
            {(showAll ? forSlot : forSlot.slice(0, 8)).map(option)}
            {!showAll && forSlot.length > 8 && (
              <button className="row row-button" onClick={() => setShowAll(true)}>Ver las {forSlot.length - 8} restantes</button>
            )}
          </Card>
        </>
      )}

      <Card title="Otra cosa" footer="Para comidas fuera de casa o algo que no está en el recetario. Si escribes los ingredientes con su cantidad, las calorías se calculan solas; si pones un número a mano, manda el tuyo. No entra en la lista de la compra.">
        <label className="row">
          <span>Nombre</span>
          <input className="text-input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Cena fuera" />
        </label>
        <div className="row stacked">
          <span>Ingredientes y cantidades <small className="muted">(opcional)</small></span>
          <textarea
            className="textarea"
            rows={4}
            value={customIngredients}
            onChange={(e) => setCustomIngredients(e.target.value)}
            placeholder={'2 huevos\n40 g pan integral\n1 cucharadita de aceite'}
            aria-label="Ingredientes y cantidades"
          />
          <IngredientBreakdown result={calc} />
        </div>
        <label className="row">
          <span>Calorías{customKcal === undefined && calc.kcal > 0 ? ' (calculadas)' : ' aprox.'}</span>
          <span className="row-value">
            <NumberInput ariaLabel="Calorías aproximadas" decimals={false} value={customKcal} placeholder={calc.kcal > 0 ? String(calc.kcal) : undefined} onChange={setCustomKcal} />
            <span className="unit">kcal</span>
          </span>
        </label>
        <button className="row row-button" onClick={saveCustom}>Guardar</button>
      </Card>
    </Page>
  )
}
