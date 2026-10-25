import { useState } from 'react'
import { Card, NumberInput, Page } from '../components/ui'
import { db } from '../lib/db'
import { mealSlots, parseIngredientLines, slotLabel, type MealSlot, type Recipe } from '../lib/recipes'

/** Crear una receta propia, por ejemplo una encontrada en Cookidoo o en internet. */
export function RecipeFormPage({ params }: { params: URLSearchParams }) {
  const initialSlot = params.get('slot') as MealSlot | null
  const [name, setName] = useState(params.get('nombre') ?? '')
  const [slots, setSlots] = useState<MealSlot[]>(initialSlot ? [initialSlot] : ['almuerzo'])
  const [kcal, setKcal] = useState<number>()
  const [protein, setProtein] = useState<number>()
  const [carbs, setCarbs] = useState<number>()
  const [fat, setFat] = useState<number>()
  const [minutes, setMinutes] = useState<number>()
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [thermomix, setThermomix] = useState('')
  const [error, setError] = useState<string>()

  async function save() {
    if (!name.trim() || !kcal || slots.length === 0) {
      setError('Pon al menos el nombre, las calorías por ración y en qué comidas encaja.')
      return
    }
    const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
    const recipe: Recipe = {
      id: `propia-${Date.now()}`,
      name: name.trim(),
      slots,
      kcal,
      proteinG: protein ?? 0,
      carbsG: carbs ?? 0,
      fatG: fat ?? 0,
      minutes: minutes ?? 0,
      ingredients: parseIngredientLines(ingredients),
      steps: lines(steps),
      thermomix: lines(thermomix).length ? lines(thermomix) : undefined,
    }
    await db.customRecipes.put(recipe)
    history.back()
  }

  const numberRow = (label: string, value: number | undefined, set: (v: number | undefined) => void, unit: string) => (
    <label className="row">
      <span>{label}</span>
      <span className="row-value">
        <NumberInput ariaLabel={label} value={value} onChange={set} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )

  return (
    <Page title="Receta propia" actions={<button className="text-button" onClick={() => history.back()}>Cancelar</button>}>
      <Card>
        <label className="row">
          <span>Nombre</span>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pollo al limón" />
        </label>
        <div className="row chips">
          {mealSlots.map((s) => (
            <button
              key={s}
              className={`chip${slots.includes(s) ? ' selected' : ''}`}
              aria-pressed={slots.includes(s)}
              onClick={() => setSlots(slots.includes(s) ? slots.filter((x) => x !== s) : [...slots, s])}
            >
              {slotLabel[s]}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Por ración" footer="Si la receta es de Cookidoo, los valores nutricionales vienen en la ficha de la receta.">
        {numberRow('Calorías', kcal, setKcal, 'kcal')}
        {numberRow('Proteína', protein, setProtein, 'g')}
        {numberRow('Hidratos', carbs, setCarbs, 'g')}
        {numberRow('Grasa', fat, setFat, 'g')}
        {numberRow('Tiempo', minutes, setMinutes, 'min')}
      </Card>

      <Card title="Ingredientes por ración" footer="Uno por línea, por ejemplo «150 g pechuga de pollo» o «2 huevos». Van a la lista de la compra en «Otros».">
        <textarea className="textarea" rows={5} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={'150 g pechuga de pollo\n1 limón\n60 g arroz'} />
      </Card>

      <Card title="Preparación" footer="Un paso por línea. Opcional.">
        <textarea className="textarea" rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} />
      </Card>

      {(slots.includes('almuerzo') || slots.includes('cena')) && (
        <Card title="Pasos Thermomix" footer="Opcional. Un paso por línea.">
          <textarea className="textarea" rows={3} value={thermomix} onChange={(e) => setThermomix(e.target.value)} />
        </Card>
      )}

      {error && <p className="error-text">{error}</p>}
      <button className="primary wide" onClick={save}>Guardar receta</button>
    </Page>
  )
}
